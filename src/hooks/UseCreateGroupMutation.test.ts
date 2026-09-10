import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const createGroup = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/groups/create-group', () => ({
  createGroup: (...args: unknown[]) => createGroup(...args),
}));

const { default: useCreateGroupMutation } = await import('./UseCreateGroupMutation');

describe('useCreateGroupMutation', () => {
  it('invalidates the groups list on success', async () => {
    createGroup.mockResolvedValueOnce('group-1');
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateGroupMutation(), { wrapper: Wrapper });

    result.current.mutate({ name: 'Group A' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups-list'] });
  });

  it('does not invalidate on failure', async () => {
    createGroup.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateGroupMutation(), { wrapper: Wrapper });

    result.current.mutate({ name: 'Group A' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
