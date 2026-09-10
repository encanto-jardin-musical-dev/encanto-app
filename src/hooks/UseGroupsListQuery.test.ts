import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getGroupsPage = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/groups/get-groups-page', () => ({
  getGroupsPage: (...args: unknown[]) => getGroupsPage(...args),
}));

const { default: useGroupsListQuery } = await import('./UseGroupsListQuery');

function makeGroup(id: string) {
  return { id, name: id, image_url: null };
}

describe('useGroupsListQuery', () => {
  it('has no next page when the first page is short of the page size', async () => {
    getGroupsPage.mockResolvedValueOnce([makeGroup('1')]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupsListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('paginates with offset = allPages.length * PAGE_SIZE', async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => makeGroup(`g${i}`));
    getGroupsPage.mockResolvedValueOnce(fullPage).mockResolvedValueOnce([]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupsListQuery('a'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

    expect(getGroupsPage).toHaveBeenLastCalledWith({}, { search: 'a', offset: 20, pageSize: 20 });
  });

  it('propagates errors', async () => {
    getGroupsPage.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupsListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
