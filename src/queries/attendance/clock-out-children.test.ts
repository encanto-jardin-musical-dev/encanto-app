import { describe, expect, it } from 'vitest';
import { clockOutChildren } from './clock-out-children';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('clockOutChildren', () => {
  it('calls the clock_out_children RPC with the given child ids', async () => {
    const client = createSupabaseClientMock();
    client.rpc.mockResolvedValueOnce({ data: null, error: null });

    await clockOutChildren(client as unknown as TypedSupabaseClient, ['child-1', 'child-2']);

    expect(client.rpc).toHaveBeenCalledWith('clock_out_children', {
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
      clockOutChildren(client as unknown as TypedSupabaseClient, ['child-1'])
    ).rejects.toThrow('Failed to clock out children: db unavailable');
  });
});
