import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getUserChildren = vi.fn();

beforeEach(() => {
  getUserChildren.mockReset();
});

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/users/get-user-children', () => ({
  getUserChildren: (...args: unknown[]) => getUserChildren(...args),
}));

const { default: useUserChildrenQuery } = await import('./UseGetUserChildrenQuery');

describe('useUserChildrenQuery', () => {
  it('defaults to the parent-scoped query key and empty params when none are given', async () => {
    getUserChildren.mockResolvedValueOnce({ data: [], error: null });
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserChildrenQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getUserChildren).toHaveBeenCalledWith({}, undefined, undefined);
    expect(queryClient.getQueryData(['parent-user-children'])).toEqual([]);
  });

  it('scopes the query key by userID and groupID when provided', async () => {
    getUserChildren.mockResolvedValueOnce({ data: [{ id: 'child-1' }], error: null });
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useUserChildrenQuery({ params: { userID: 'user-1', groupID: 'group-1' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getUserChildren).toHaveBeenCalledWith({}, 'user-1', 'group-1');
    expect(queryClient.getQueryData(['user-children', 'user-1', 'group-1'])).toEqual([
      { id: 'child-1' },
    ]);
  });

  it('honors options.enabled to skip fetching', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useUserChildrenQuery({ params: { userID: 'user-1' }, options: { enabled: false } }),
      { wrapper: Wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getUserChildren).not.toHaveBeenCalled();
  });

  it('propagates query errors', async () => {
    getUserChildren.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUserChildrenQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
