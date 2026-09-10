import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getStaffTasks = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/tasks/get-staff-tasks', () => ({
  getStaffTasks: (...args: unknown[]) => getStaffTasks(...args),
}));

const { default: useStaffTasksQuery } = await import('./UseStaffTasksQuery');

describe('useStaffTasksQuery', () => {
  it('is disabled when userId is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useStaffTasksQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getStaffTasks).not.toHaveBeenCalled();
  });

  it('fetches and returns tasks on success, forwarding teacherId', async () => {
    getStaffTasks.mockResolvedValueOnce([{ id: 'task-1' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useStaffTasksQuery('user-1', 'teacher-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'task-1' }]);
    expect(getStaffTasks).toHaveBeenCalledWith({}, { teacherId: 'teacher-1' });
  });

  it('propagates query errors', async () => {
    getStaffTasks.mockRejectedValueOnce(new Error('Failed to fetch staff tasks: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useStaffTasksQuery('user-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch staff tasks: boom'));
  });
});
