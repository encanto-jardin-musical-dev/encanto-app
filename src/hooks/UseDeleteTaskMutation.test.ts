import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const deleteTask = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/tasks/delete-task', () => ({
  deleteTask: (...args: unknown[]) => deleteTask(...args),
}));

const { default: useDeleteTaskMutation } = await import('./UseDeleteTaskMutation');

describe('useDeleteTaskMutation', () => {
  it('removes the detail cache and invalidates the tasks list on success', async () => {
    deleteTask.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTaskMutation(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['tasks', 'detail', 'task-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });

  it('surfaces the error and skips cache updates on failure', async () => {
    deleteTask.mockRejectedValueOnce(new Error('Failed to delete task: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTaskMutation(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to delete task: boom'));
    expect(removeSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
