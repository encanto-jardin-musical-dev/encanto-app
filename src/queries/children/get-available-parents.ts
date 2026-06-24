import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getProfilesByRole, ProfileOption } from '@/queries/shared/get-profiles-by-role';

export type ParentOption = ProfileOption & { avatar_url: string | null };

export async function getAvailableParents(
  client: TypedSupabaseClient
): Promise<ParentOption[]> {
  const data = await getProfilesByRole(client, 'parent', { withAvatar: true });
  return data as ParentOption[];
}
