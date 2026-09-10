import { describe, expect, it, vi } from 'vitest';
import { resendTeacherInvite } from './resend-teacher-invite';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function createClientWithFunctions(invokeResult: { data: unknown; error: unknown }) {
  return {
    functions: { invoke: vi.fn().mockResolvedValue(invokeResult) },
  };
}

describe('resendTeacherInvite', () => {
  it('returns sent when the invite was sent', async () => {
    const client = createClientWithFunctions({ data: { status: 'sent' }, error: null });

    const result = await resendTeacherInvite(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(result).toEqual({ status: 'sent' });
  });

  it('returns already_active when the teacher is already active', async () => {
    const client = createClientWithFunctions({ data: { status: 'already_active' }, error: null });

    const result = await resendTeacherInvite(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(result).toEqual({ status: 'already_active' });
  });

  it('defaults to sent for an unrecognized response shape', async () => {
    const client = createClientWithFunctions({ data: { unexpected: true }, error: null });

    const result = await resendTeacherInvite(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(result).toEqual({ status: 'sent' });
  });

  it('throws a generic error when the function call fails without a JSON body', async () => {
    const client = createClientWithFunctions({ data: null, error: { message: 'network error' } });

    await expect(
      resendTeacherInvite(client as unknown as TypedSupabaseClient, 'teacher-1')
    ).rejects.toThrow('Failed to resend teacher invite: network error');
  });

  it('surfaces a specific error code parsed from the function error body', async () => {
    const client = createClientWithFunctions({
      data: null,
      error: {
        message: 'network error',
        context: { json: () => Promise.resolve({ error: 'TEACHER_NOT_FOUND' }) },
      },
    });

    await expect(
      resendTeacherInvite(client as unknown as TypedSupabaseClient, 'teacher-1')
    ).rejects.toThrow('TEACHER_NOT_FOUND');
  });
});
