// Thin shim — delegates to the shared imageStorage factory.
// Mirrors uploadChildAvatar.ts; kept for API consistency across domains.

import { teacherAvatarStorage } from '@/utils/imageStorage';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export class AvatarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarValidationError';
  }
}

export async function uploadTeacherAvatar(teacherId: string, file: File): Promise<string> {
  try {
    return await teacherAvatarStorage.upload(teacherId, file);
  } catch (err) {
    if (err instanceof teacherAvatarStorage.ValidationError) {
      throw new AvatarValidationError(err.message);
    }
    throw err;
  }
}

export async function getTeacherAvatarSignedUrl(
  client: TypedSupabaseClient,
  path: string | null
): Promise<string | null> {
  return teacherAvatarStorage.getSignedUrl(client, path);
}

export async function getTeacherAvatarSignedUrls(
  client: TypedSupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return teacherAvatarStorage.getSignedUrls(client, paths);
}
