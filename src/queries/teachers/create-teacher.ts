import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';

export type CreateTeacherParams = {
  email: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  role: 'teacher';
  phone?: string | null;
  groupIds?: string[];
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
 * Creates a teacher by invoking the admin-create-user edge function.
 * The function sends the invite email and returns the created profile.
 * Returns the new teacher's profile id.
 */
export async function createTeacher(
  client: TypedSupabaseClient,
  params: CreateTeacherParams
): Promise<string> {
  const { groupIds, ...inviteParams } = params;

  const { data, error } = await client.functions.invoke<AdminCreateUserResponse>(
    'admin-create-user',
    {
      body: {
        email: inviteParams.email,
        role: 'teacher',
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
      // If the inner throw is our own Error, re-throw it
      if (parseErr instanceof Error && parseErr.message !== error.message) {
        throw parseErr;
      }
    }
    throw new Error(`Failed to create teacher: ${error.message}`);
  }

  if (!data?.profile?.id) {
    throw new Error('Failed to create teacher: no profile returned');
  }

  const teacherId = data.profile.id;

  // Assign groups after creation
  if (groupIds && groupIds.length > 0) {
    await reconcileLinks(client, {
      table: 'group_teachers',
      parentColumn: 'teacher_id',
      childColumn: 'group_id',
      parentId: teacherId,
      desired: groupIds,
      getKey: (g) => g,
      buildRow: (group_id) => ({ teacher_id: teacherId, group_id }),
    });
  }

  return teacherId;
}
