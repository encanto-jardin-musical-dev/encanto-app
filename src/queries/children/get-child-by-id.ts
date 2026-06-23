import { TypedSupabaseClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';
import { getChildAvatarSignedUrl } from '@/utils/uploadChildAvatar';

export type ChildDetail = {
  id: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  gender: Database['public']['Enums']['gender_type'];
  birth_date: string;
  address: string | null;
  avatar_url: string | null;
  groups: Array<{ id: string; name: string; image_url: string | null }>;
  guardians: Array<{
    id: string;
    first_name: string;
    last_name: string;
    relationship: Database['public']['Enums']['guardian_relationship'];
  }>;
};

export async function getChildById(
  client: TypedSupabaseClient,
  childID: string
): Promise<ChildDetail | null> {
  // Use limit(1) + index instead of .single() so that multiple rows returned
  // by PostgREST due to one-to-many embedded joins (child_guardians, child_groups)
  // do not trigger a PGRST109 "multiple rows" error.
  const { data, error } = await client
    .from('children')
    .select(`
      id,
      first_name,
      last_name,
      document_type,
      document_number,
      gender,
      birth_date,
      address,
      avatar_url,
      child_groups (
        groups (
          id,
          name,
          image_url
        )
      ),
      child_guardians (
        relationship,
        guardian_id,
        profiles (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('id', childID)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch child: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  const avatarUrl = await getChildAvatarSignedUrl(client, row.avatar_url);

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    document_type: row.document_type,
    document_number: row.document_number,
    gender: row.gender,
    birth_date: row.birth_date,
    address: row.address,
    avatar_url: avatarUrl,
    groups: (row.child_groups ?? [])
      .map((cg) => cg.groups)
      .filter((g): g is { id: string; name: string; image_url: string | null } => g !== null),
    guardians: (row.child_guardians ?? [])
      .filter((cg) => cg.profiles !== null && cg.guardian_id !== null)
      .map((cg) => {
        // profiles is returned as an object (to-one relation) but type it defensively
        const profile = Array.isArray(cg.profiles) ? cg.profiles[0] : cg.profiles;
        if (!profile) return null;
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          relationship: cg.relationship,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null),
  };
}
