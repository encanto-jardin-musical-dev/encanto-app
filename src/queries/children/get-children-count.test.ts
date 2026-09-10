import { describe, expect, it, vi } from 'vitest';
import { getChildrenCount } from './get-children-count';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function createCountClient(result: { count: number | null; error: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    then: (onFulfilled: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };

  return { from: vi.fn(() => builder) };
}

describe('getChildrenCount', () => {
  it('returns the children count', async () => {
    const client = createCountClient({ count: 12, error: null });

    const result = await getChildrenCount(client as unknown as TypedSupabaseClient);

    expect(result).toBe(12);
    expect(client.from).toHaveBeenCalledWith('children');
  });

  it('returns 0 when count is null', async () => {
    const client = createCountClient({ count: null, error: null });

    const result = await getChildrenCount(client as unknown as TypedSupabaseClient);

    expect(result).toBe(0);
  });

  it('throws when the query errors', async () => {
    const client = createCountClient({ count: null, error: { message: 'timeout' } });

    await expect(getChildrenCount(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch children count: timeout'
    );
  });
});
