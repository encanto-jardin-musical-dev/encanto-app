// Thin shim — delegates to the shared imageStorage factory.
// Mirrors uploadTeacherAvatar.ts; kept for API consistency across domains.

import { parentAvatarStorage } from '@/utils/imageStorage';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export class AvatarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarValidationError';
  }
}

export async function uploadParentAvatar(parentId: string, file: File): Promise<string> {
  try {
    return await parentAvatarStorage.upload(parentId, file);
  } catch (err) {
    if (err instanceof parentAvatarStorage.ValidationError) {
      throw new AvatarValidationError(err.message);
    }
    throw err;
  }
}

export async function getParentAvatarSignedUrl(
  client: TypedSupabaseClient,
  path: string | null
): Promise<string | null> {
  return parentAvatarStorage.getSignedUrl(client, path);
}

export async function getParentAvatarSignedUrls(
  client: TypedSupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return parentAvatarStorage.getSignedUrls(client, paths);
}
