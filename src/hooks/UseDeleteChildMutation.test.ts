import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const deleteChild = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/children/delete-child', () => ({
  deleteChild: (...args: unknown[]) => deleteChild(...args),
}));

const { default: useDeleteChildMutation } = await import('./UseDeleteChildMutation');

describe('useDeleteChildMutation', () => {
  it('invalidates the list and removes the child cache entry on success', async () => {
    deleteChild.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useDeleteChildMutation(), { wrapper: Wrapper });

    result.current.mutate('child-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['children-list'] });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['child', 'child-1'] });
  });

  it('does not touch the cache on failure', async () => {
    deleteChild.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteChildMutation(), { wrapper: Wrapper });

    result.current.mutate('child-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
