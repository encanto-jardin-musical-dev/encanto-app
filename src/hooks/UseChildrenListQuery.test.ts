import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getChildrenPage = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/children/get-children-page', () => ({
  getChildrenPage: (...args: unknown[]) => getChildrenPage(...args),
}));

const { default: useChildrenListQuery } = await import('./UseChildrenListQuery');

function makeChild(id: string) {
  return { id, first_name: id, last_name: 'X', avatar_url: null, parentName: null };
}

describe('useChildrenListQuery', () => {
  it('has no next page when the first page is short of the page size', async () => {
    getChildrenPage.mockResolvedValueOnce([makeChild('1')]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildrenListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('paginates with offset = allPages.length * PAGE_SIZE', async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => makeChild(`c${i}`));
    getChildrenPage.mockResolvedValueOnce(fullPage).mockResolvedValueOnce([]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildrenListQuery('ada'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

    expect(getChildrenPage).toHaveBeenLastCalledWith(
      {},
      { search: 'ada', offset: 20, pageSize: 20 }
    );
  });

  it('propagates errors', async () => {
    getChildrenPage.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildrenListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
