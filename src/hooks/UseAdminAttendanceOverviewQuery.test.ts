import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getAdminAttendanceOverview = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/get-admin-attendance-overview', () => ({
  getAdminAttendanceOverview: (...args: unknown[]) => getAdminAttendanceOverview(...args),
}));

const { useAdminAttendanceOverviewQuery } = await import('./UseAdminAttendanceOverviewQuery');

describe('useAdminAttendanceOverviewQuery', () => {
  it('returns the overview on success', async () => {
    getAdminAttendanceOverview.mockResolvedValueOnce([{ groupId: 'g1', groupName: 'A', children: [] }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAdminAttendanceOverviewQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ groupId: 'g1', groupName: 'A', children: [] }]);
  });

  it('propagates errors', async () => {
    getAdminAttendanceOverview.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAdminAttendanceOverviewQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
