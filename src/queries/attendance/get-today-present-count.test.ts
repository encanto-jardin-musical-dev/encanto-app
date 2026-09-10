import { describe, expect, it, vi } from 'vitest';
import { getTodayPresentCount } from './get-today-present-count';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

/**
 * `.select('*', { count: 'exact', head: true })` resolves to `{ count, error }`
 * rather than `{ data, error }`, so build a small chainable stub instead of
 * using the shared mock (whose MockResult type only carries `data`/`error`).
 */
function createCountClient(result: { count: number | null; error: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: (onFulfilled: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };

  return { from: vi.fn(() => builder) };
}

describe('getTodayPresentCount', () => {
  it('returns the present count', async () => {
    const client = createCountClient({ count: 4, error: null });

    const result = await getTodayPresentCount(client as unknown as TypedSupabaseClient);

    expect(result).toBe(4);
    expect(client.from).toHaveBeenCalledWith('attendance');
  });

  it('returns 0 when count is null', async () => {
    const client = createCountClient({ count: null, error: null });

    const result = await getTodayPresentCount(client as unknown as TypedSupabaseClient);

    expect(result).toBe(0);
  });

  it('throws when the query errors', async () => {
    const client = createCountClient({ count: null, error: { message: 'timeout' } });

    await expect(
      getTodayPresentCount(client as unknown as TypedSupabaseClient)
    ).rejects.toThrow("Failed to fetch today's present count: timeout");
  });
});
