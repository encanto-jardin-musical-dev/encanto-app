import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getTeacherById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/teachers/get-teacher-by-id', () => ({
  getTeacherById: (...args: unknown[]) => getTeacherById(...args),
}));

const { default: useTeacherByIdQuery } = await import('./UseTeacherByIdQuery');

describe('useTeacherByIdQuery', () => {
  it('is disabled when teacherID is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useTeacherByIdQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getTeacherById).not.toHaveBeenCalled();
  });

  it('fetches and returns the teacher on success', async () => {
    getTeacherById.mockResolvedValueOnce({ id: 'teacher-1', first_name: 'Ada' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTeacherByIdQuery('teacher-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'teacher-1', first_name: 'Ada' });
  });

  it('propagates query errors', async () => {
    getTeacherById.mockRejectedValueOnce(new Error('Failed to fetch teacher: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTeacherByIdQuery('teacher-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch teacher: boom'));
  });
});
