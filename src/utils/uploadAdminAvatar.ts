// Thin shim — delegates to the shared imageStorage factory.
// Mirrors uploadTeacherAvatar.ts; kept for API consistency across domains.

import { adminAvatarStorage } from '@/utils/imageStorage';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export class AvatarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarValidationError';
  }
}

export async function uploadAdminAvatar(adminId: string, file: File): Promise<string> {
  try {
    return await adminAvatarStorage.upload(adminId, file);
  } catch (err) {
    if (err instanceof adminAvatarStorage.ValidationError) {
      throw new AvatarValidationError(err.message);
    }
    throw err;
  }
}

export async function getAdminAvatarSignedUrl(
  client: TypedSupabaseClient,
  path: string | null
): Promise<string | null> {
  return adminAvatarStorage.getSignedUrl(client, path);
}

export async function getAdminAvatarSignedUrls(
  client: TypedSupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return adminAvatarStorage.getSignedUrls(client, paths);
}
