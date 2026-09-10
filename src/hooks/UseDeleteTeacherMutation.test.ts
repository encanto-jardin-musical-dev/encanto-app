import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const deleteTeacher = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/teachers/delete-teacher', () => ({
  deleteTeacher: (...args: unknown[]) => deleteTeacher(...args),
}));

const { default: useDeleteTeacherMutation } = await import('./UseDeleteTeacherMutation');

describe('useDeleteTeacherMutation', () => {
  it('invalidates the teachers list and removes the detail cache on success', async () => {
    deleteTeacher.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useDeleteTeacherMutation(), { wrapper: Wrapper });

    result.current.mutate('teacher-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teachers-list'] });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['teacher', 'teacher-1'] });
  });

  it('surfaces the error and skips cache updates on failure', async () => {
    deleteTeacher.mockRejectedValueOnce(new Error('Failed to delete teacher: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useDeleteTeacherMutation(), { wrapper: Wrapper });

    result.current.mutate('teacher-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to delete teacher: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});
