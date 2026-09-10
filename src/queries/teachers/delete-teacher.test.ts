import { describe, expect, it, vi } from 'vitest';
import { deleteTeacher } from './delete-teacher';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function createClientWithFunctions(invokeResult: { data: unknown; error: unknown }) {
  return {
    functions: { invoke: vi.fn().mockResolvedValue(invokeResult) },
  };
}

describe('deleteTeacher', () => {
  it('invokes admin-delete-user with the teacher id', async () => {
    const client = createClientWithFunctions({ data: null, error: null });

    await deleteTeacher(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-delete-user', {
      body: { userId: 'teacher-1' },
    });
  });

  it('throws when the function call fails', async () => {
    const client = createClientWithFunctions({ data: null, error: { message: 'boom' } });

    await expect(
      deleteTeacher(client as unknown as TypedSupabaseClient, 'teacher-1')
    ).rejects.toThrow('Failed to delete teacher: boom');
  });
});
