import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getChildrenCount = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/children/get-children-count', () => ({
  getChildrenCount: (...args: unknown[]) => getChildrenCount(...args),
}));

const { default: useChildrenCountQuery } = await import('./UseChildrenCountQuery');

describe('useChildrenCountQuery', () => {
  it('returns the count on success', async () => {
    getChildrenCount.mockResolvedValueOnce(3);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildrenCountQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(3);
  });

  it('propagates errors', async () => {
    getChildrenCount.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildrenCountQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
