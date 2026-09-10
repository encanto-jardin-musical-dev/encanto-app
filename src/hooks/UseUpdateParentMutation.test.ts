import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const updateParent = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/parents/update-parent', () => ({
  updateParent: (...args: unknown[]) => updateParent(...args),
}));

const { default: useUpdateParentMutation } = await import('./UseUpdateParentMutation');

const params = {
  id: 'parent-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc' as const,
  document_number: '123',
  role: 'parent' as const,
  children: [],
};

describe('useUpdateParentMutation', () => {
  it('invalidates the parents list and the individual parent cache on success', async () => {
    updateParent.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateParentMutation(), { wrapper: Wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parents-list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parent', 'parent-1'] });
  });

  it('skips cache invalidation on failure', async () => {
    updateParent.mockRejectedValueOnce(new Error('Failed to update parent: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateParentMutation(), { wrapper: Wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error('Failed to update parent: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
