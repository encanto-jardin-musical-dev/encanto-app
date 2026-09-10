import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getParentsPage = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/parents/get-parents-page', () => ({
  getParentsPage: (...args: unknown[]) => getParentsPage(...args),
}));

const { default: useParentsListQuery } = await import('./UseParentsListQuery');

describe('useParentsListQuery', () => {
  it('has no next page when a page is shorter than the page size', async () => {
    getParentsPage.mockResolvedValueOnce([{ id: 'p1' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useParentsListQuery('grace'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getParentsPage).toHaveBeenCalledWith(
      {},
      { search: 'grace', offset: 0, pageSize: 20 }
    );
    expect(result.current.hasNextPage).toBe(false);
  });

  it('offsets by page count on subsequent pages', async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}` }));
    getParentsPage.mockResolvedValueOnce(fullPage).mockResolvedValueOnce([{ id: 'p20' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useParentsListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

    expect(getParentsPage).toHaveBeenLastCalledWith({}, { search: '', offset: 20, pageSize: 20 });
  });

  it('propagates query errors', async () => {
    getParentsPage.mockRejectedValueOnce(new Error('Failed to fetch parents page: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useParentsListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch parents page: boom'));
  });
});
