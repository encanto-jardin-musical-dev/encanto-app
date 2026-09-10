import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getReportById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/get-report-by-id', () => ({
  getReportById: (...args: unknown[]) => getReportById(...args),
}));

const { default: useReportByIdQuery } = await import('./UseReportByIdQuery');

describe('useReportByIdQuery', () => {
  it('is disabled when reportId is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useReportByIdQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getReportById).not.toHaveBeenCalled();
  });

  it('fetches and returns the report on success', async () => {
    getReportById.mockResolvedValueOnce({ id: 'report-1', title: 'Nap time' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useReportByIdQuery('report-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'report-1', title: 'Nap time' });
  });

  it('propagates query errors', async () => {
    getReportById.mockRejectedValueOnce(new Error('Failed to fetch report: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useReportByIdQuery('report-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch report: boom'));
  });
});
