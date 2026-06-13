import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { GuardianEntry } from './create-child';

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

  // Fetch existing group links
  const { data: existingLinks, error: fetchError } = await client
    .from('child_groups')
    .select('group_id')
    .eq('child_id', id);

  if (fetchError) {
    throw new Error(`Failed to fetch group links: ${fetchError.message}`);
  }

  const existingGroupIds = (existingLinks ?? []).map((l) => l.group_id).filter((g): g is string => g !== null);
  const toAdd = groupIds.filter((g) => !existingGroupIds.includes(g));
  const toRemove = existingGroupIds.filter((g) => !groupIds.includes(g));

  if (toAdd.length > 0) {
    const { error: addError } = await client
      .from('child_groups')
      .insert(toAdd.map((group_id) => ({ child_id: id, group_id })));
    if (addError) throw new Error(`Failed to add group links: ${addError.message}`);
  }

  if (toRemove.length > 0) {
    const { error: removeError } = await client
      .from('child_groups')
      .delete()
      .eq('child_id', id)
      .in('group_id', toRemove);
    if (removeError) throw new Error(`Failed to remove group links: ${removeError.message}`);
  }

  // Reconcile guardian links
  const { data: existingGuardianLinks, error: guardianFetchError } = await client
    .from('child_guardians')
    .select('guardian_id')
    .eq('child_id', id);

  if (guardianFetchError) {
    throw new Error(`Failed to fetch guardian links: ${guardianFetchError.message}`);
  }

  const existingGuardianIds = (existingGuardianLinks ?? [])
    .map((l) => l.guardian_id)
    .filter((g): g is string => g !== null);

  const newGuardianIds = guardians.map((g) => g.guardian_id);
  const guardiansToAdd = guardians.filter((g) => !existingGuardianIds.includes(g.guardian_id));
  const guardiansToRemove = existingGuardianIds.filter((g) => !newGuardianIds.includes(g));

  if (guardiansToAdd.length > 0) {
    const { error: addGuardianError } = await client
      .from('child_guardians')
      .insert(
        guardiansToAdd.map(({ guardian_id, relationship }) => ({
          child_id: id,
          guardian_id,
          relationship,
        }))
      );
    if (addGuardianError) throw new Error(`Failed to add guardian links: ${addGuardianError.message}`);
  }

  if (guardiansToRemove.length > 0) {
    const { error: removeGuardianError } = await client
      .from('child_guardians')
      .delete()
      .eq('child_id', id)
      .in('guardian_id', guardiansToRemove);
    if (removeGuardianError) throw new Error(`Failed to remove guardian links: ${removeGuardianError.message}`);
  }
}
