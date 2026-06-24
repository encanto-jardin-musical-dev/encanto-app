import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';
import { ChildLinkEntry } from './get-parent-by-id';

export type UpdateParentParams = {
  id: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  role: Database['public']['Enums']['user_role'];
  phone?: string | null;
  avatar_url?: string | null;
  children: ChildLinkEntry[];
};

export async function updateParent(
  client: TypedSupabaseClient,
  params: UpdateParentParams
): Promise<void> {
  const { id, children, ...profileData } = params;

  const { error } = await client
    .from('profiles')
    .update(profileData)
    .eq('id', id)
    .eq('role', 'parent');

  if (error) {
    throw new Error(`Failed to update parent: ${error.message}`);
  }

  // Reconcile child_guardians links (relationship is a mutable field — re-synced when changed)
  await reconcileLinks(client, {
    table: 'child_guardians',
    parentColumn: 'guardian_id',
    childColumn: 'child_id',
    parentId: id,
    desired: children,
    getKey: (e) => e.child_id,
    buildRow: ({ child_id, relationship }) => ({
      guardian_id: id,
      child_id,
      relationship,
    }),
    mutableFields: ['relationship'],
  });
}
