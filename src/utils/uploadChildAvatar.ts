// Thin shim — delegates to the shared imageStorage factory.
// Kept for backwards compatibility; use childAvatarStorage from imageStorage.ts directly.

import { childAvatarStorage } from '@/utils/imageStorage';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export class AvatarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarValidationError';
  }
}

export async function uploadChildAvatar(childId: string, file: File): Promise<string> {
  try {
    return await childAvatarStorage.upload(childId, file);
  } catch (err) {
    if (err instanceof childAvatarStorage.ValidationError) {
      throw new AvatarValidationError(err.message);
    }
    throw err;
  }
}

export async function getChildAvatarSignedUrl(
  client: TypedSupabaseClient,
  path: string | null
): Promise<string | null> {
  return childAvatarStorage.getSignedUrl(client, path);
}

export async function getChildAvatarSignedUrls(
  client: TypedSupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return childAvatarStorage.getSignedUrls(client, paths);
}
