import { describe, expect, it, vi } from 'vitest';
import { createTeacher } from './create-teacher';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function createClientWithFunctions(invokeResult: { data: unknown; error: unknown }) {
  const base = createSupabaseClientMock({
    group_teachers: { data: [], error: null },
  });
  return {
    ...base,
    functions: { invoke: vi.fn().mockResolvedValue(invokeResult) },
  };
}

describe('createTeacher', () => {
  it('returns the new teacher id on success', async () => {
    const client = createClientWithFunctions({
      data: { profile: { id: 'teacher-1' } },
      error: null,
    });

    const id = await createTeacher(client as unknown as TypedSupabaseClient, {
      email: 'teacher@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
    });

    expect(id).toBe('teacher-1');
    expect(client.functions.invoke).toHaveBeenCalledWith(
      'admin-create-user',
      expect.objectContaining({ body: expect.objectContaining({ email: 'teacher@example.com' }) })
    );
  });

  it('assigns groups after creation when groupIds are provided', async () => {
    const client = createClientWithFunctions({
      data: { profile: { id: 'teacher-1' } },
      error: null,
    });

    await createTeacher(client as unknown as TypedSupabaseClient, {
      email: 'teacher@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
      groupIds: ['group-1'],
    });

    expect(client.from).toHaveBeenCalledWith('group_teachers');
  });

  it('throws a generic error when the function call fails without a JSON body', async () => {
    const client = createClientWithFunctions({
      data: null,
      error: { message: 'network error' },
    });

    await expect(
      createTeacher(client as unknown as TypedSupabaseClient, {
        email: 'teacher@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        document_type: 'cc',
        document_number: '123',
        role: 'teacher',
      })
    ).rejects.toThrow('Failed to create teacher: network error');
  });

  it('surfaces a specific error code parsed from the function error body', async () => {
    const client = createClientWithFunctions({
      data: null,
      error: {
        message: 'network error',
        context: { json: () => Promise.resolve({ error: 'EMAIL_ALREADY_REGISTERED' }) },
      },
    });

    await expect(
      createTeacher(client as unknown as TypedSupabaseClient, {
        email: 'teacher@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        document_type: 'cc',
        document_number: '123',
        role: 'teacher',
      })
    ).rejects.toThrow('EMAIL_ALREADY_REGISTERED');
  });

  it('throws when no profile is returned', async () => {
    const client = createClientWithFunctions({ data: {}, error: null });

    await expect(
      createTeacher(client as unknown as TypedSupabaseClient, {
        email: 'teacher@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        document_type: 'cc',
        document_number: '123',
        role: 'teacher',
      })
    ).rejects.toThrow('Failed to create teacher: no profile returned');
  });
});
