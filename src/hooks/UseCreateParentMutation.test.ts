import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const createParent = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/parents/create-parent', () => ({
  createParent: (...args: unknown[]) => createParent(...args),
}));

const { default: useCreateParentMutation } = await import('./UseCreateParentMutation');

const params = {
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc' as const,
  document_number: '123',
  role: 'parent' as const,
};

describe('useCreateParentMutation', () => {
  it('invalidates the parents list on success', async () => {
    createParent.mockResolvedValueOnce('parent-1');
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateParentMutation(), { wrapper: Wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parents-list'] });
  });

  it('skips cache invalidation on failure', async () => {
    createParent.mockRejectedValueOnce(new Error('Failed to create parent: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateParentMutation(), { wrapper: Wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to create parent: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
