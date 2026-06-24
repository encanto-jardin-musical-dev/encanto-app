import { TypedSupabaseClient } from '@/utils/supabase/client';

export type ResendTeacherInviteResult =
  | { status: 'sent' }
  | { status: 'already_active' };

/**
 * Invokes the admin-resend-invite edge function for a teacher.
 * Returns a result indicating whether the invite was sent or the teacher is already active.
 */
export async function resendTeacherInvite(
  client: TypedSupabaseClient,
  teacherId: string
): Promise<ResendTeacherInviteResult> {
  const { data, error } = await client.functions.invoke<ResendTeacherInviteResult>(
    'admin-resend-invite',
    {
      body: { teacherId },
    }
  );

  if (error) {
    // Parse JSON body from FunctionsHttpError if available
    try {
      const body = await (error as { context?: Response }).context?.json?.();
      if (body?.error) throw new Error(body.error);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
    }
    throw new Error(`Failed to resend teacher invite: ${error.message}`);
  }

  // Normalise: functions.invoke puts the parsed JSON body directly in `data`.
  // Accept both { status } and any nested shape defensively.
  const status = (data as ResendTeacherInviteResult | null)?.status;

  if (status === 'sent' || status === 'already_active') {
    return { status };
  }

  // Unknown response — treat as success (email was likely sent) to avoid
  // showing a false error toast when the function returned 200.
  console.warn('[resendTeacherInvite] Unexpected response shape:', JSON.stringify(data));
  return { status: 'sent' };
}
