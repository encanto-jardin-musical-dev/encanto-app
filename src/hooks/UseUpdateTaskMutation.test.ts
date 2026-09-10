import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const updateTask = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/tasks/update-task', () => ({
  updateTask: (...args: unknown[]) => updateTask(...args),
}));

const { default: useUpdateTaskMutation } = await import('./UseUpdateTaskMutation');

describe('useUpdateTaskMutation', () => {
  it('invalidates the tasks cache on success', async () => {
    updateTask.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper: Wrapper });

    result.current.mutate({ taskId: 'task-1', title: 'Updated', groupId: 'group-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    updateTask.mockRejectedValueOnce(new Error('Failed to update task: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper: Wrapper });

    result.current.mutate({ taskId: 'task-1', title: 'Updated', groupId: 'group-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to update task: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
