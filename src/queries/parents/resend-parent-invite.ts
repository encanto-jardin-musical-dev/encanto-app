import { TypedSupabaseClient } from '@/utils/supabase/client';

export type ResendParentInviteResult =
  | { status: 'sent' }
  | { status: 'already_active' };

/**
 * Invokes the admin-resend-invite edge function for a parent.
 * Returns a result indicating whether the invite was sent or the parent is already active.
 */
export async function resendParentInvite(
  client: TypedSupabaseClient,
  parentId: string
): Promise<ResendParentInviteResult> {
  const { data, error } = await client.functions.invoke<ResendParentInviteResult>(
    'admin-resend-invite',
    {
      body: { userId: parentId },
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
    throw new Error(`Failed to resend parent invite: ${error.message}`);
  }

  const status = (data as ResendParentInviteResult | null)?.status;

  if (status === 'sent' || status === 'already_active') {
    return { status };
  }

  // Unknown response — treat as success
  console.warn('[resendParentInvite] Unexpected response shape:', JSON.stringify(data));
  return { status: 'sent' };
}
