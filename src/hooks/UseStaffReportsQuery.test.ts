import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getStaffReports = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/get-staff-reports', () => ({
  getStaffReports: (...args: unknown[]) => getStaffReports(...args),
}));

const { default: useStaffReportsQuery } = await import('./UseStaffReportsQuery');

describe('useStaffReportsQuery', () => {
  it('is disabled when userId is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useStaffReportsQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getStaffReports).not.toHaveBeenCalled();
  });

  it('fetches and returns reports on success, forwarding teacherId', async () => {
    getStaffReports.mockResolvedValueOnce([{ id: 'report-1' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useStaffReportsQuery('user-1', 'teacher-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'report-1' }]);
    expect(getStaffReports).toHaveBeenCalledWith({}, { teacherId: 'teacher-1' });
  });

  it('propagates query errors', async () => {
    getStaffReports.mockRejectedValueOnce(new Error('Failed to fetch staff reports: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useStaffReportsQuery('user-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch staff reports: boom'));
  });
});
