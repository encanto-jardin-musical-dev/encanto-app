// Client-side attachment upload orchestration
// Requests presigned PUT URLs from the upload-attachment-url edge function,
// then uploads files directly to S3 in parallel with per-file progress tracking.

import type { Attachment } from '@/types/messages.types';
import { createClient } from '@/utils/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadProgress {
  file: File;
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadFailure {
  file: File;
  error: Error;
}

export interface UploadError extends Error {
  succeeded: Attachment[];
  failed: UploadFailure[];
}

// ---------------------------------------------------------------------------
// Presigned URL request
// ---------------------------------------------------------------------------

interface PresignedFileResult {
  key: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
}

async function requestPresignedUrls(files: File[]): Promise<PresignedFileResult[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

  const response = await fetch(`${supabaseUrl}/functions/v1/upload-attachment-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      files: files.map(f => ({
        contentType: f.type,
        size: f.size,
        name: f.name,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? `Failed to get presigned URLs: ${response.status}`);
  }

  const data = await response.json();
  return data.files as PresignedFileResult[];
}

// ---------------------------------------------------------------------------
// Per-file upload with XHR progress reporting
// ---------------------------------------------------------------------------

function uploadFileToS3(
  file: File,
  presigned: PresignedFileResult,
  onProgress: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress({
          file,
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', presigned.url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Uploads a list of files to S3 using presigned PUT URLs.
 * Uploads run in parallel; if any fail, rejects with an UploadError
 * that includes which files succeeded and which failed.
 *
 * @param files - The files to upload
 * @param onProgress - Called with progress updates per file
 * @returns Array of Attachment metadata for the uploaded files
 */
export async function uploadAttachments(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<Attachment[]> {
  if (files.length === 0) return [];

  // Request presigned PUT URLs for all files
  const presignedResults = await requestPresignedUrls(files);

  const succeeded: Attachment[] = [];
  const failed: UploadFailure[] = [];

  // Upload all files in parallel
  await Promise.allSettled(
    files.map(async (file, index) => {
      const presigned = presignedResults[index];
      try {
        await uploadFileToS3(file, presigned, (progress) => {
          onProgress?.(progress);
        });
        succeeded.push({
          key: presigned.key,
          contentType: presigned.contentType,
          size: presigned.size,
          name: presigned.name,
        });
      } catch (error) {
        failed.push({ file, error: error instanceof Error ? error : new Error(String(error)) });
      }
    })
  );

  // 6.3 If any upload failed, reject with details
  if (failed.length > 0) {
    const uploadError = new Error(
      `${failed.length} of ${files.length} attachment(s) failed to upload`
    ) as UploadError;
    uploadError.succeeded = succeeded;
    uploadError.failed = failed;
    throw uploadError;
  }

  return succeeded;
}
