import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getAllGroups = vi.fn();

beforeEach(() => {
  getAllGroups.mockReset();
});

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/users/get-all-groups', () => ({
  getAllGroups: (...args: unknown[]) => getAllGroups(...args),
}));

const { default: useUserAllGroupsQuery } = await import('./UseGetAllGroupsQuery');

describe('useUserAllGroupsQuery', () => {
  it('fetches and unwraps the groups on success', async () => {
    getAllGroups.mockResolvedValueOnce({ data: [{ id: 'group-1' }], error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserAllGroupsQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'group-1' }]);
  });

  it('propagates a rejection from the underlying query', async () => {
    getAllGroups.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserAllGroupsQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });

  it('honors extra query options such as enabled: false', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserAllGroupsQuery({ enabled: false }), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getAllGroups).not.toHaveBeenCalled();
  });
});
