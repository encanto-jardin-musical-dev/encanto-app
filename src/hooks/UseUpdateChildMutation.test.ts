import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';
import type { UpdateChildParams } from '@/queries/children/update-child';

const updateChild = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/children/update-child', () => ({
  updateChild: (...args: unknown[]) => updateChild(...args),
}));

const { default: useUpdateChildMutation } = await import('./UseUpdateChildMutation');

const params: UpdateChildParams = {
  id: 'child-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc',
  document_number: '123',
  gender: 'female',
  birth_date: '2019-01-01',
  address: 'Main St',
  groupIds: [],
  guardians: [],
};

describe('useUpdateChildMutation', () => {
  it('invalidates the list and the specific child on success', async () => {
    updateChild.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateChildMutation(), { wrapper: Wrapper });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['children-list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['child', 'child-1'] });
  });

  it('does not invalidate on failure', async () => {
    updateChild.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateChildMutation(), { wrapper: Wrapper });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
