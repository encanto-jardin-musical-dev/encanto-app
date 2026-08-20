import { createClient } from '@/utils/supabase/client';

const SIGNED_URL_TTL = 60 * 60; // 1 hour

type UserRole = 'admin' | 'teacher' | 'parent';

/** Maps a profile role to its storage bucket. */
export function avatarBucket(role: UserRole | string | null | undefined): string | null {
  if (role === 'teacher') return 'teacher-avatars';
  if (role === 'parent') return 'parent-avatars';
  if (role === 'admin') return 'admin-avatars';
  return null;
}

/** Resolves a signed URL for a raw avatar storage path. */
export async function getSignedAvatarUrl(
  role: UserRole | string | null | undefined,
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;
  const bucket = avatarBucket(role);
  if (!bucket) return null;

  const { data } = await createClient()
    .storage.from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);

  return data?.signedUrl ?? null;
}
