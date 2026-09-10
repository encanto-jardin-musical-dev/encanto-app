import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getTeachersPage = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/teachers/get-teachers-page', () => ({
  getTeachersPage: (...args: unknown[]) => getTeachersPage(...args),
}));

const { default: useTeachersListQuery } = await import('./UseTeachersListQuery');

const PAGE_SIZE = 20;

function makeTeacher(id: string) {
  return { id, first_name: id, last_name: 'Teacher', role: 'teacher', avatar_url: null };
}

describe('useTeachersListQuery', () => {
  it('fetches the first page starting at offset 0', async () => {
    getTeachersPage.mockResolvedValueOnce([makeTeacher('t1')]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTeachersListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTeachersPage).toHaveBeenCalledWith({}, { search: '', offset: 0, pageSize: PAGE_SIZE });
  });

  it('has no next page when a page is short of the page size', async () => {
    getTeachersPage.mockResolvedValueOnce([makeTeacher('t1')]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTeachersListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('requests the next offset based on pages already fetched', async () => {
    const fullPage = Array.from({ length: PAGE_SIZE }, (_, i) => makeTeacher(`t${i}`));
    getTeachersPage.mockResolvedValueOnce(fullPage).mockResolvedValueOnce([makeTeacher('t-next')]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTeachersListQuery('ada'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

    expect(getTeachersPage).toHaveBeenLastCalledWith(
      {},
      { search: 'ada', offset: PAGE_SIZE, pageSize: PAGE_SIZE }
    );
  });

  it('propagates query errors', async () => {
    getTeachersPage.mockRejectedValueOnce(new Error('Failed to fetch teachers page: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTeachersListQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch teachers page: boom'));
  });
});
