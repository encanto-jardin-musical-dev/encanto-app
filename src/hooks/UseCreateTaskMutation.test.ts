import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const createTask = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/tasks/create-task', () => ({
  createTask: (...args: unknown[]) => createTask(...args),
}));

const { default: useCreateTaskMutation } = await import('./UseCreateTaskMutation');

describe('useCreateTaskMutation', () => {
  it('invalidates the tasks cache on success', async () => {
    createTask.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTaskMutation(), { wrapper: Wrapper });

    result.current.mutate({ title: 'Bring snacks', groupId: 'group-1', teacherId: 'teacher-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    createTask.mockRejectedValueOnce(new Error('Failed to create task: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTaskMutation(), { wrapper: Wrapper });

    result.current.mutate({ title: 'Bring snacks', groupId: 'group-1', teacherId: 'teacher-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to create task: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
