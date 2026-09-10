import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const deleteGroup = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/groups/delete-group', () => ({
  deleteGroup: (...args: unknown[]) => deleteGroup(...args),
}));

const { default: useDeleteGroupMutation } = await import('./UseDeleteGroupMutation');

describe('useDeleteGroupMutation', () => {
  it('invalidates the list and removes the group cache entry on success', async () => {
    deleteGroup.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useDeleteGroupMutation(), { wrapper: Wrapper });

    result.current.mutate('group-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups-list'] });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['group', 'group-1'] });
  });

  it('does not touch the cache on failure', async () => {
    deleteGroup.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteGroupMutation(), { wrapper: Wrapper });

    result.current.mutate('group-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
