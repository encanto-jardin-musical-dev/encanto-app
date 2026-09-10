import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getGroupAttendance = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/get-group-attendance', () => ({
  getGroupAttendance: (...args: unknown[]) => getGroupAttendance(...args),
}));

const { default: useGroupAttendanceQuery } = await import('./UseGroupAttendanceQuery');

describe('useGroupAttendanceQuery', () => {
  it('is disabled when groupId is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGroupAttendanceQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupAttendance).not.toHaveBeenCalled();
  });

  it('returns attendance rows on success', async () => {
    getGroupAttendance.mockResolvedValueOnce([]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupAttendanceQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('propagates errors', async () => {
    getGroupAttendance.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupAttendanceQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
