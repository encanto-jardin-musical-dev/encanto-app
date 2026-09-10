import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const createChild = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/children/create-child', () => ({
  createChild: (...args: unknown[]) => createChild(...args),
}));

const { default: useCreateChildMutation } = await import('./UseCreateChildMutation');

describe('useCreateChildMutation', () => {
  it('invalidates the children list and count caches on success', async () => {
    createChild.mockResolvedValueOnce('new-child-id');
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateChildMutation(), { wrapper: Wrapper });

    result.current.mutate({
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      gender: 'female',
      birth_date: '2019-01-01',
      address: '123 Main St',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['children-list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['children-count'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    createChild.mockRejectedValueOnce(new Error('Failed to create child: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateChildMutation(), { wrapper: Wrapper });

    result.current.mutate({
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      gender: 'female',
      birth_date: '2019-01-01',
      address: '123 Main St',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error('Failed to create child: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
