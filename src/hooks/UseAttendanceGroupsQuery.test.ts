import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getAttendanceGroups = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/get-attendance-groups', () => ({
  getAttendanceGroups: (...args: unknown[]) => getAttendanceGroups(...args),
}));

const { default: useAttendanceGroupsQuery } = await import('./UseAttendanceGroupsQuery');

describe('useAttendanceGroupsQuery', () => {
  it('passes the teacherId through to the query function', async () => {
    getAttendanceGroups.mockResolvedValueOnce([]);
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useAttendanceGroupsQuery('teacher-1'), { wrapper: Wrapper });

    await waitFor(() =>
      expect(getAttendanceGroups).toHaveBeenCalledWith({}, { teacherId: 'teacher-1' })
    );
  });

  it('returns groups on success', async () => {
    getAttendanceGroups.mockResolvedValueOnce([{ id: 'g1', name: 'A', image_url: null }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendanceGroupsQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'g1', name: 'A', image_url: null }]);
  });

  it('propagates errors', async () => {
    getAttendanceGroups.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendanceGroupsQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
