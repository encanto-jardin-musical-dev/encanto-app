import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';
import { ChildLinkEntry } from './get-parent-by-id';

export type CreateParentParams = {
  email: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  role: 'parent';
  phone?: string | null;
  children?: ChildLinkEntry[];
};

type CreatedProfile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  document_type: string;
  document_number: string;
  phone: string | null;
  avatar_url: string | null;
};

type AdminCreateUserResponse = {
  profile: CreatedProfile;
};

/**
 * Creates a parent by invoking the admin-create-user edge function.
 * The function sends the invite email and returns the created profile.
 * After creation, reconciles child_guardians links with per-row relationship.
 * Returns the new parent's profile id.
 */
export async function createParent(
  client: TypedSupabaseClient,
  params: CreateParentParams
): Promise<string> {
  const { children, ...inviteParams } = params;

  const { data, error } = await client.functions.invoke<AdminCreateUserResponse>(
    'admin-create-user',
    {
      body: {
        email: inviteParams.email,
        role: 'parent',
        first_name: inviteParams.first_name,
        last_name: inviteParams.last_name,
        document_type: inviteParams.document_type,
        document_number: inviteParams.document_number,
        phone: inviteParams.phone ?? null,
      },
    }
  );

  if (error) {
    // FunctionsHttpError carries the JSON body in error.context — parse it to
    // surface specific error codes (e.g. EMAIL_ALREADY_REGISTERED) to the UI.
    try {
      const body = await (error as { context?: Response }).context?.json?.();
      if (body?.error) {
        throw new Error(body.error);
      }
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== error.message) {
        throw parseErr;
      }
    }
    throw new Error(`Failed to create parent: ${error.message}`);
  }

  if (!data?.profile?.id) {
    throw new Error('Failed to create parent: no profile returned');
  }

  const parentId = data.profile.id;

  // Assign children after creation using reconcileLinks on child_guardians
  // using the parent's profile id as guardian_id
  if (children && children.length > 0) {
    await reconcileLinks(client, {
      table: 'child_guardians',
      parentColumn: 'guardian_id',
      childColumn: 'child_id',
      parentId,
      desired: children,
      getKey: (e) => e.child_id,
      buildRow: ({ child_id, relationship }) => ({
        guardian_id: parentId,
        child_id,
        relationship,
      }),
    });
  }

  return parentId;
}
