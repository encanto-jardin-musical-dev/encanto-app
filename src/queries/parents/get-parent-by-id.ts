import { TypedSupabaseClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';
import { getParentAvatarSignedUrl } from '@/utils/uploadParentAvatar';

export type ChildLinkEntry = {
  child_id: string;
  relationship: Database['public']['Enums']['guardian_relationship'];
};

export type ParentDetail = {
  id: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  role: Database['public']['Enums']['user_role'];
  phone: string | null;
  avatar_url: string | null;
  children: Array<{
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    relationship: Database['public']['Enums']['guardian_relationship'];
  }>;
};

export async function getParentById(
  client: TypedSupabaseClient,
  parentId: string
): Promise<ParentDetail | null> {
  const { data, error } = await client
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      document_type,
      document_number,
      role,
      phone,
      avatar_url,
      child_guardians (
        relationship,
        children (
          id,
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .eq('id', parentId)
    .eq('role', 'parent')
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch parent: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  const avatarUrl = await getParentAvatarSignedUrl(client, row.avatar_url);

  const children = (row.child_guardians ?? [])
    .map((cg) => {
      if (!cg.children) return null;
      return {
        id: cg.children.id,
        first_name: cg.children.first_name,
        last_name: cg.children.last_name,
        avatar_url: cg.children.avatar_url ?? null,
        relationship: cg.relationship,
      };
    })
    .filter(
      (
        c
      ): c is {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
        relationship: Database['public']['Enums']['guardian_relationship'];
      } => c !== null
    );

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    document_type: row.document_type,
    document_number: row.document_number,
    role: row.role,
    phone: row.phone,
    avatar_url: avatarUrl,
    children,
  };
}
