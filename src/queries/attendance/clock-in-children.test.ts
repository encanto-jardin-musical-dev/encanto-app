import { describe, expect, it } from 'vitest';
import { clockInChildren } from './clock-in-children';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('clockInChildren', () => {
  it('calls the clock_in_children RPC with the given child ids', async () => {
    const client = createSupabaseClientMock();
    client.rpc.mockResolvedValueOnce({ data: null, error: null });

    await clockInChildren(client as unknown as TypedSupabaseClient, ['child-1', 'child-2']);

    expect(client.rpc).toHaveBeenCalledWith('clock_in_children', {
      child_ids: ['child-1', 'child-2'],
    });
  });

  it('throws when the RPC errors', async () => {
    const client = createSupabaseClientMock();
    client.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'db unavailable' },
    });

    await expect(
      clockInChildren(client as unknown as TypedSupabaseClient, ['child-1'])
    ).rejects.toThrow('Failed to clock in children: db unavailable');
  });
});
