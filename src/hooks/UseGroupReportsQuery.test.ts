import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getGroupReports = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/get-group-reports', () => ({
  getGroupReports: (...args: unknown[]) => getGroupReports(...args),
}));

const { default: useGroupReportsQuery } = await import('./UseGroupReportsQuery');

describe('useGroupReportsQuery', () => {
  it('is disabled when groupId is missing', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGroupReportsQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupReports).not.toHaveBeenCalled();
  });

  it('is disabled when the caller passes enabled=false', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGroupReportsQuery('group-1', null, false), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupReports).not.toHaveBeenCalled();
  });

  it('fetches and returns reports on success', async () => {
    getGroupReports.mockResolvedValueOnce([{ id: 'report-1' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupReportsQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'report-1' }]);
    expect(getGroupReports).toHaveBeenCalledWith({}, 'group-1', undefined, false);
  });

  it('propagates query errors', async () => {
    getGroupReports.mockRejectedValueOnce(new Error('Failed to fetch group reports: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupReportsQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch group reports: boom'));
  });
});
