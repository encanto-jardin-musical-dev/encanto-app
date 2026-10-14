import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getAttendanceReport = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/get-attendance-report', () => ({
  getAttendanceReport: (...args: unknown[]) => getAttendanceReport(...args),
}));

const { default: useAttendanceReportQuery } = await import('./UseAttendanceReportQuery');

const filters = { childId: 'c1', from: '2026-10-01', to: '2026-10-13' };

describe('useAttendanceReportQuery', () => {
  it('does not fetch without a submitted filter snapshot', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendanceReportQuery(null), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getAttendanceReport).not.toHaveBeenCalled();
  });

  it('fetches with the filters and returns rows', async () => {
    getAttendanceReport.mockResolvedValueOnce([{ attendance_id: 'a1' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendanceReportQuery(filters), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAttendanceReport).toHaveBeenCalledWith({}, filters);
    expect(result.current.data).toEqual([{ attendance_id: 'a1' }]);
  });

  it('returns an empty list', async () => {
    getAttendanceReport.mockResolvedValueOnce([]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendanceReportQuery(filters), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('propagates errors', async () => {
    getAttendanceReport.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendanceReportQuery(filters), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
