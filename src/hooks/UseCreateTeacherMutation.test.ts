import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const createTeacher = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/teachers/create-teacher', () => ({
  createTeacher: (...args: unknown[]) => createTeacher(...args),
}));

const { default: useCreateTeacherMutation } = await import('./UseCreateTeacherMutation');

describe('useCreateTeacherMutation', () => {
  it('invalidates the teachers list cache on success', async () => {
    createTeacher.mockResolvedValueOnce('teacher-1');
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTeacherMutation(), { wrapper: Wrapper });

    result.current.mutate({
      email: 'teacher@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teachers-list'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    createTeacher.mockRejectedValueOnce(new Error('Failed to create teacher: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTeacherMutation(), { wrapper: Wrapper });

    result.current.mutate({
      email: 'teacher@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to create teacher: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
