import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { GuardianEntry } from './create-child';
import { reconcileLinks } from '@/queries/shared/reconcile-links';

export type UpdateChildParams = {
  id: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  gender: Database['public']['Enums']['gender_type'];
  birth_date: string;
  address: string;
  avatar_url?: string | null;
  groupIds: string[];
  guardians: GuardianEntry[];
};

export async function updateChild(
  client: TypedSupabaseClient,
  params: UpdateChildParams
): Promise<void> {
  const { id, groupIds, guardians, ...childData } = params;

  const { error } = await client
    .from('children')
    .update(childData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update child: ${error.message}`);
  }

  // Reconcile group links
  await reconcileLinks(client, {
    table: 'child_groups',
    parentColumn: 'child_id',
    childColumn: 'group_id',
    parentId: id,
    desired: groupIds,
    getKey: (g) => g,
    buildRow: (group_id) => ({ child_id: id, group_id }),
  });

  // Reconcile guardian links (relationship is a mutable field — re-synced when changed)
  await reconcileLinks(client, {
    table: 'child_guardians',
    parentColumn: 'child_id',
    childColumn: 'guardian_id',
    parentId: id,
    desired: guardians,
    getKey: (g) => g.guardian_id,
    buildRow: ({ guardian_id, relationship }) => ({ child_id: id, guardian_id, relationship }),
    mutableFields: ['relationship'],
  });
}
