import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';

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
    await reconcileLinks(client, {
      table: 'child_groups',
      parentColumn: 'child_id',
      childColumn: 'group_id',
      parentId: childId,
      desired: groupIds,
      getKey: (g) => g,
      buildRow: (group_id) => ({ child_id: childId, group_id }),
    });
  }

  if (guardians && guardians.length > 0) {
    await reconcileLinks(client, {
      table: 'child_guardians',
      parentColumn: 'child_id',
      childColumn: 'guardian_id',
      parentId: childId,
      desired: guardians,
      getKey: (g) => g.guardian_id,
      buildRow: ({ guardian_id, relationship }) => ({ child_id: childId, guardian_id, relationship }),
    });
  }

  return childId;
}
