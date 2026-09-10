import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getTodayPresentCount = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/get-today-present-count', () => ({
  getTodayPresentCount: (...args: unknown[]) => getTodayPresentCount(...args),
}));

const { default: useTodayPresentCountQuery } = await import('./UseTodayPresentCountQuery');

describe('useTodayPresentCountQuery', () => {
  it('returns the count on success', async () => {
    getTodayPresentCount.mockResolvedValueOnce(7);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTodayPresentCountQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
  });

  it('propagates errors', async () => {
    getTodayPresentCount.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTodayPresentCountQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
