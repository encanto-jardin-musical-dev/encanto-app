// Client-side attachment upload orchestration.
// Uploads files directly to the private Supabase Storage `message-attachments`
// bucket via the Supabase Storage client. Upload role gating (teacher/admin) is
// enforced by the bucket's INSERT RLS policy; client-side validation still runs
// first (see ./validate.ts).
//
// Progress: Supabase's `upload()` does not expose per-file byte progress like
// the previous XHR/S3 flow, so we emit a coarse pending → complete signal
// (0% before, 100% after) per file, preserving the `onProgress` contract.

import type { Attachment } from '@/types/messages.types';
import { createClient } from '@/utils/supabase/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUCKET = 'message-attachments';

/** Maps allowed MIME types to file extensions for the object key. */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

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
// Helpers
// ---------------------------------------------------------------------------

/** Sanitize a filename: strip path traversal, keep only safe characters. */
function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);
}

/**
 * Generate a Supabase Storage object path with a date-based prefix.
 * Preserves the historical S3 key convention `messages/{yyyy}/{mm}/{uuid}.{ext}`
 * so migrated objects and metadata stay compatible with existing rows.
 */
function generateKey(contentType: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();
  const ext = MIME_TO_EXT[contentType] ?? 'bin';
  return `messages/${yyyy}/${mm}/${uuid}.${ext}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Uploads a list of files to the private `message-attachments` Supabase Storage
 * bucket. Uploads run in parallel; if any fail, rejects with an UploadError that
 * includes which files succeeded and which failed.
 *
 * The returned `Attachment[]` shape (`key`, `contentType`, `size`, `name`) is
 * unchanged from the previous S3 implementation, so `messages.attachments`
 * (and task/report attachment) rows remain valid.
 *
 * @param files - The files to upload
 * @param onProgress - Called with coarse progress updates per file (0 then 100)
 * @returns Array of Attachment metadata for the uploaded files
 */
export async function uploadAttachments(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<Attachment[]> {
  if (files.length === 0) return [];

  const supabase = createClient();

  const succeeded: Attachment[] = [];
  const failed: UploadFailure[] = [];

  await Promise.allSettled(
    files.map(async (file) => {
      const key = generateKey(file.type);

      // Coarse progress: signal upload start.
      onProgress?.({ file, loaded: 0, total: file.size, percent: 0 });

      const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        failed.push({ file, error: error instanceof Error ? error : new Error(String(error)) });
        return;
      }

      // Coarse progress: signal upload complete.
      onProgress?.({ file, loaded: file.size, total: file.size, percent: 100 });

      succeeded.push({
        key,
        contentType: file.type,
        size: file.size,
        name: sanitizeFilename(file.name),
      });
    })
  );

  // If any upload failed, reject with details.
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
