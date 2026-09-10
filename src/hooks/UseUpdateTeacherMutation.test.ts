import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const updateTeacher = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/teachers/update-teacher', () => ({
  updateTeacher: (...args: unknown[]) => updateTeacher(...args),
}));

const { default: useUpdateTeacherMutation } = await import('./UseUpdateTeacherMutation');

describe('useUpdateTeacherMutation', () => {
  it('invalidates the teachers list and that teacher detail cache on success', async () => {
    updateTeacher.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTeacherMutation(), { wrapper: Wrapper });

    result.current.mutate({
      id: 'teacher-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
      groupIds: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teachers-list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teacher', 'teacher-1'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    updateTeacher.mockRejectedValueOnce(new Error('Failed to update teacher: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTeacherMutation(), { wrapper: Wrapper });

    result.current.mutate({
      id: 'teacher-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
      groupIds: [],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to update teacher: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
