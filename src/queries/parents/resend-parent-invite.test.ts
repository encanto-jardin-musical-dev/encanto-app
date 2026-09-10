import { describe, expect, it, vi } from 'vitest';
import { resendParentInvite } from './resend-parent-invite';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function clientWithInvoke(result: { data: unknown; error: unknown }) {
  return { functions: { invoke: vi.fn().mockResolvedValue(result) } } as unknown as TypedSupabaseClient;
}

describe('resendParentInvite', () => {
  it('invokes admin-resend-invite with the parent id and returns a sent status', async () => {
    const client = clientWithInvoke({ data: { status: 'sent' }, error: null });

    const result = await resendParentInvite(client, 'parent-1');

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-resend-invite', {
      body: { userId: 'parent-1' },
    });
    expect(result).toEqual({ status: 'sent' });
  });

  it('returns an already_active status', async () => {
    const client = clientWithInvoke({ data: { status: 'already_active' }, error: null });

    const result = await resendParentInvite(client, 'parent-1');

    expect(result).toEqual({ status: 'already_active' });
  });

  it('treats an unrecognized response shape as sent', async () => {
    const client = clientWithInvoke({ data: { unexpected: true }, error: null });

    const result = await resendParentInvite(client, 'parent-1');

    expect(result).toEqual({ status: 'sent' });
  });

  it('throws with the edge function error message', async () => {
    const client = clientWithInvoke({ data: null, error: { message: 'boom' } });

    await expect(resendParentInvite(client, 'parent-1')).rejects.toThrow(
      'Failed to resend parent invite: boom'
    );
  });
});
