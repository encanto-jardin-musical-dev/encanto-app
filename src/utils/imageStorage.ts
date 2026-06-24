// Generic Supabase Storage helper factory for private image buckets.
// Creates validated upload + signed-URL utilities parameterized by bucket and file label.

import { createClient } from '@/utils/supabase/client';
import { TypedSupabaseClient } from '@/utils/supabase/client';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export interface ImageStorage {
  ValidationError: new (message: string) => Error;
  upload: (entityId: string, file: File) => Promise<string>;
  getSignedUrl: (client: TypedSupabaseClient, path: string | null) => Promise<string | null>;
  getSignedUrls: (client: TypedSupabaseClient, paths: string[]) => Promise<Map<string, string>>;
}

export function createImageStorage(opts: { bucket: string; fileLabel: string }): ImageStorage {
  const { bucket, fileLabel } = opts;

  class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }

  async function upload(entityId: string, file: File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError(
        `Tipo de archivo no permitido: ${file.type}. Solo JPEG, PNG o WebP.`
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new ValidationError('La imagen supera el límite de 5 MB.');
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${entityId}/${fileLabel}.${ext}`;

    const supabase = createClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    return path;
  }

  async function getSignedUrl(
    client: TypedSupabaseClient,
    path: string | null
  ): Promise<string | null> {
    if (!path) return null;

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error) return null;
    return data.signedUrl;
  }

  async function getSignedUrls(
    client: TypedSupabaseClient,
    paths: string[]
  ): Promise<Map<string, string>> {
    const uniquePaths = Array.from(new Set(paths));
    if (uniquePaths.length === 0) return new Map();

    const { data, error } = await client.storage
      .from(bucket)
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

  return { ValidationError, upload, getSignedUrl, getSignedUrls };
}

// Pre-built singletons — drop-in replacements for the bespoke upload utils.
export const childAvatarStorage = createImageStorage({
  bucket: 'children-avatars',
  fileLabel: 'avatar',
});

export const groupImageStorage = createImageStorage({
  bucket: 'group-images',
  fileLabel: 'image',
});

export const teacherAvatarStorage = createImageStorage({
  bucket: 'teacher-avatars',
  fileLabel: 'avatar',
});
