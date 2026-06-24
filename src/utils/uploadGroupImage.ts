// Thin shim — delegates to the shared imageStorage factory.
// Kept for backwards compatibility; use groupImageStorage from imageStorage.ts directly.

import { groupImageStorage } from '@/utils/imageStorage';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export async function uploadGroupImage(groupId: string, file: File): Promise<string> {
  try {
    return await groupImageStorage.upload(groupId, file);
  } catch (err) {
    if (err instanceof groupImageStorage.ValidationError) {
      throw new ImageValidationError(err.message);
    }
    throw err;
  }
}

export async function getGroupImageSignedUrl(
  client: TypedSupabaseClient,
  path: string | null
): Promise<string | null> {
  return groupImageStorage.getSignedUrl(client, path);
}

export async function getGroupImageSignedUrls(
  client: TypedSupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return groupImageStorage.getSignedUrls(client, paths);
}
