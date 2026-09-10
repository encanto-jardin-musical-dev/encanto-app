import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getTaskById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/tasks/get-task-by-id', () => ({
  getTaskById: (...args: unknown[]) => getTaskById(...args),
}));

const { default: useTaskByIdQuery } = await import('./UseTaskByIdQuery');

describe('useTaskByIdQuery', () => {
  it('is disabled when taskId is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useTaskByIdQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getTaskById).not.toHaveBeenCalled();
  });

  it('fetches and returns the task on success', async () => {
    getTaskById.mockResolvedValueOnce({ id: 'task-1', title: 'Bring snacks' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTaskByIdQuery('task-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'task-1', title: 'Bring snacks' });
  });

  it('propagates query errors', async () => {
    getTaskById.mockRejectedValueOnce(new Error('Failed to fetch task: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTaskByIdQuery('task-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch task: boom'));
  });
});
