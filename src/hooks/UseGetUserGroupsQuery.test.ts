import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getUserGroups = vi.fn();

beforeEach(() => {
  getUserGroups.mockReset();
});

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/users/get-user-groups', () => ({
  getUserGroups: (...args: unknown[]) => getUserGroups(...args),
}));

const { default: useUserGroupsQuery } = await import('./UseGetUserGroupsQuery');

describe('useUserGroupsQuery', () => {
  it('fetches and unwraps the groups on success', async () => {
    getUserGroups.mockResolvedValueOnce({ data: [{ id: 'group-1' }], error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserGroupsQuery('teacher-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getUserGroups).toHaveBeenCalledWith({}, 'teacher-1');
    expect(result.current.data).toEqual([{ id: 'group-1' }]);
  });

  it('propagates a rejection from the underlying query', async () => {
    getUserGroups.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserGroupsQuery('teacher-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });

  it('honors extra query options such as enabled: false', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserGroupsQuery('teacher-1', { enabled: false }), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getUserGroups).not.toHaveBeenCalled();
  });
});
