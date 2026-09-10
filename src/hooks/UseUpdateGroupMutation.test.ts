import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';
import type { UpdateGroupParams } from '@/queries/groups/update-group';

const updateGroup = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/groups/update-group', () => ({
  updateGroup: (...args: unknown[]) => updateGroup(...args),
}));

const { default: useUpdateGroupMutation } = await import('./UseUpdateGroupMutation');

const params: UpdateGroupParams = { id: 'group-1', name: 'Group A', teacherIds: [] };

describe('useUpdateGroupMutation', () => {
  it('invalidates the list and the specific group on success', async () => {
    updateGroup.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateGroupMutation(), { wrapper: Wrapper });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups-list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['group', 'group-1'] });
  });

  it('does not invalidate on failure', async () => {
    updateGroup.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateGroupMutation(), { wrapper: Wrapper });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
