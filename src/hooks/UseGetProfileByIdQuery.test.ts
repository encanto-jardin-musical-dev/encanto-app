import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getProfileById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/users/get-profile-by-id', () => ({
  getProfileById: (...args: unknown[]) => getProfileById(...args),
}));

const { useGetProfileByIdQuery } = await import('./UseGetProfileByIdQuery');

describe('useGetProfileByIdQuery', () => {
  it('is disabled when id is undefined', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGetProfileByIdQuery(undefined), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getProfileById).not.toHaveBeenCalled();
  });

  it('fetches and returns the profile on success', async () => {
    getProfileById.mockResolvedValueOnce({ id: 'user-1', first_name: 'Ada' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGetProfileByIdQuery('user-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'user-1', first_name: 'Ada' });
  });

  it('seeds the cache with initialData', () => {
    // With a 5-minute staleTime, initialData is considered fresh, so the
    // query resolves from it without ever invoking the queryFn.
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () =>
        useGetProfileByIdQuery('user-1', {
          initialData: { id: 'user-1', first_name: 'Cached', last_name: 'Ada', role: 'parent', avatar_url: null },
        }),
      { wrapper: Wrapper }
    );

    expect(result.current.data).toEqual({
      id: 'user-1',
      first_name: 'Cached',
      last_name: 'Ada',
      role: 'parent',
      avatar_url: null,
    });
  });

  it('propagates query errors', async () => {
    getProfileById.mockRejectedValueOnce(new Error('Failed to fetch profile: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGetProfileByIdQuery('user-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch profile: boom'));
  });
});
