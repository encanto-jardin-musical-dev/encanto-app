import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getGroupTasks = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/tasks/get-group-tasks', () => ({
  getGroupTasks: (...args: unknown[]) => getGroupTasks(...args),
}));

const { default: useGroupTasksQuery } = await import('./UseGroupTasksQuery');

describe('useGroupTasksQuery', () => {
  it('is disabled when groupId is missing', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGroupTasksQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupTasks).not.toHaveBeenCalled();
  });

  it('is disabled when the caller passes enabled=false', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGroupTasksQuery('group-1', false), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupTasks).not.toHaveBeenCalled();
  });

  it('fetches and returns tasks on success', async () => {
    getGroupTasks.mockResolvedValueOnce([{ id: 'task-1' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupTasksQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'task-1' }]);
  });

  it('propagates query errors', async () => {
    getGroupTasks.mockRejectedValueOnce(new Error('Failed to fetch group tasks: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupTasksQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch group tasks: boom'));
  });
});
