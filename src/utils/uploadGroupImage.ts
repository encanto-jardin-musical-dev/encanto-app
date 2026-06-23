// Upload a group image to Supabase Storage and resolve stored paths
// to signed URLs (the `group-images` bucket is private).

import { createClient } from '@/utils/supabase/client';
import { TypedSupabaseClient } from '@/utils/supabase/client';

const BUCKET = 'group-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Validates and uploads a group image to the `group-images` bucket.
 *
 * @param groupId - The group's UUID (used as the storage path).
 * @param file    - The image File selected by the user.
 * @returns       The storage path of the uploaded image (the bucket is
 *                private, so callers must resolve it to a signed URL for display).
 */
export async function uploadGroupImage(groupId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageValidationError(
      `Tipo de archivo no permitido: ${file.type}. Solo JPEG, PNG o WebP.`
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new ImageValidationError('La imagen supera el límite de 5 MB.');
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${groupId}/image.${ext}`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  return path;
}

/**
 * Resolves a single stored image path to a signed URL for display.
 * Returns null if `path` is null or signing fails.
 */
export async function getGroupImageSignedUrl(
  client: TypedSupabaseClient,
  path: string | null
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

/**
 * Resolves multiple stored image paths to signed URLs in a single batch call.
 * Returns a Map from path to signed URL; paths that fail to sign are omitted.
 */
export async function getGroupImageSignedUrls(
  client: TypedSupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(new Set(paths));
  if (uniquePaths.length === 0) return new Map();

  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return new Map();

  const result = new Map<string, string>();
  for (const entry of data) {
    if (!entry.error && entry.signedUrl && entry.path) {
      result.set(entry.path, entry.signedUrl);
    }
  }
  return result;
}
