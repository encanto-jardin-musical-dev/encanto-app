import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getUserProfiles = vi.fn();

beforeEach(() => {
  getUserProfiles.mockReset();
});

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/users/get-user-profiles', () => ({
  getUserProfiles: (...args: unknown[]) => getUserProfiles(...args),
}));

const { default: useGetUserProfilesQuery } = await import('./UseGetUserProfilesQuery');

describe('useGetUserProfilesQuery', () => {
  it('short-circuits to an empty array without calling the query when userIds is empty', async () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGetUserProfilesQuery({ params: { userIds: [] } }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(getUserProfiles).not.toHaveBeenCalled();
  });

  it('fetches and defaults a null result to an empty array', async () => {
    getUserProfiles.mockResolvedValueOnce({ data: null, error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useGetUserProfilesQuery({ params: { userIds: ['user-1'] } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getUserProfiles).toHaveBeenCalledWith({}, ['user-1']);
    expect(result.current.data).toEqual([]);
  });

  it('returns the fetched profiles on success', async () => {
    getUserProfiles.mockResolvedValueOnce({ data: [{ id: 'user-1' }], error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useGetUserProfilesQuery({ params: { userIds: ['user-1'] } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'user-1' }]);
  });

  it('propagates a rejection from the underlying query', async () => {
    getUserProfiles.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useGetUserProfilesQuery({ params: { userIds: ['user-1'] } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
