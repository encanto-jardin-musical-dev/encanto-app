import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const deleteParent = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/parents/delete-parent', () => ({
  deleteParent: (...args: unknown[]) => deleteParent(...args),
}));

const { default: useDeleteParentMutation } = await import('./UseDeleteParentMutation');

describe('useDeleteParentMutation', () => {
  it('invalidates the parents list and removes the deleted parent from cache on success', async () => {
    deleteParent.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useDeleteParentMutation(), { wrapper: Wrapper });
    result.current.mutate('parent-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parents-list'] });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['parent', 'parent-1'] });
  });

  it('skips cache updates on failure', async () => {
    deleteParent.mockRejectedValueOnce(new Error('Failed to delete parent: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteParentMutation(), { wrapper: Wrapper });
    result.current.mutate('parent-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error('Failed to delete parent: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
