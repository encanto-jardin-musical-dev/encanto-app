import { describe, expect, it, vi } from 'vitest';
import { deleteParent } from './delete-parent';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function clientWithInvoke(result: { data: unknown; error: unknown }) {
  return { functions: { invoke: vi.fn().mockResolvedValue(result) } } as unknown as TypedSupabaseClient;
}

describe('deleteParent', () => {
  it('invokes admin-delete-user with the parent id', async () => {
    const client = clientWithInvoke({ data: null, error: null });

    await deleteParent(client, 'parent-1');

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-delete-user', {
      body: { userId: 'parent-1' },
    });
  });

  it('throws a generic error when the edge function fails without a JSON body', async () => {
    const client = clientWithInvoke({ data: null, error: { message: 'boom' } });

    await expect(deleteParent(client, 'parent-1')).rejects.toThrow('Failed to delete parent: boom');
  });

  it('surfaces a specific error code parsed from the function error body', async () => {
    const error = {
      message: 'boom',
      context: { json: vi.fn().mockResolvedValue({ error: 'USER_NOT_FOUND' }) },
    };
    const client = clientWithInvoke({ data: null, error });

    await expect(deleteParent(client, 'parent-1')).rejects.toThrow('USER_NOT_FOUND');
  });
});
