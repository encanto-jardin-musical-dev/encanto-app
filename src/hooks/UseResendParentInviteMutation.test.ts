import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const resendParentInvite = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/parents/resend-parent-invite', () => ({
  resendParentInvite: (...args: unknown[]) => resendParentInvite(...args),
}));

const { default: useResendParentInviteMutation } = await import('./UseResendParentInviteMutation');

describe('useResendParentInviteMutation', () => {
  it('resolves the invite status on success', async () => {
    resendParentInvite.mockResolvedValueOnce({ status: 'sent' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useResendParentInviteMutation(), { wrapper: Wrapper });
    result.current.mutate('parent-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(resendParentInvite).toHaveBeenCalledWith({}, 'parent-1');
    expect(result.current.data).toEqual({ status: 'sent' });
  });

  it('propagates errors', async () => {
    resendParentInvite.mockRejectedValueOnce(new Error('Failed to resend parent invite: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useResendParentInviteMutation(), { wrapper: Wrapper });
    result.current.mutate('parent-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to resend parent invite: boom'));
  });
});
