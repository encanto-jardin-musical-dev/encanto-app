import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const resendTeacherInvite = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/teachers/resend-teacher-invite', () => ({
  resendTeacherInvite: (...args: unknown[]) => resendTeacherInvite(...args),
}));

const { default: useResendTeacherInviteMutation } = await import('./UseResendTeacherInviteMutation');

describe('useResendTeacherInviteMutation', () => {
  it('returns the result on success without touching the cache', async () => {
    resendTeacherInvite.mockResolvedValueOnce({ status: 'sent' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useResendTeacherInviteMutation(), { wrapper: Wrapper });

    result.current.mutate('teacher-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: 'sent' });
  });

  it('surfaces the error on failure', async () => {
    resendTeacherInvite.mockRejectedValueOnce(new Error('Failed to resend teacher invite: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useResendTeacherInviteMutation(), { wrapper: Wrapper });

    result.current.mutate('teacher-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to resend teacher invite: boom'));
  });
});
