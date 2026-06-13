import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export type GuardianEntry = {
  guardian_id: string;
  relationship: Database['public']['Enums']['guardian_relationship'];
};

export type CreateChildParams = {
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  gender: Database['public']['Enums']['gender_type'];
  birth_date: string;
  address: string;
  avatar_url?: string | null;
  groupIds?: string[];
  guardians?: GuardianEntry[];
};

export async function createChild(
  client: TypedSupabaseClient,
  params: CreateChildParams
): Promise<string> {
  const { groupIds, guardians, ...childData } = params;

  const { data, error } = await client
    .from('children')
    .insert({ ...childData, avatar_url: childData.avatar_url ?? null })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create child: ${error.message}`);
  }

  const childId = data.id;

  if (groupIds && groupIds.length > 0) {
    const links = groupIds.map((group_id) => ({ child_id: childId, group_id }));
    const { error: groupError } = await client.from('child_groups').insert(links);
    if (groupError) {
      throw new Error(`Failed to link groups: ${groupError.message}`);
    }
  }

  if (guardians && guardians.length > 0) {
    const links = guardians.map(({ guardian_id, relationship }) => ({
      child_id: childId,
      guardian_id,
      relationship,
    }));
    const { error: guardianError } = await client.from('child_guardians').insert(links);
    if (guardianError) {
      throw new Error(`Failed to link guardians: ${guardianError.message}`);
    }
  }

  return childId;
}
