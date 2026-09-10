import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const deleteReport = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/delete-report', () => ({
  deleteReport: (...args: unknown[]) => deleteReport(...args),
}));

const { default: useDeleteReportMutation } = await import('./UseDeleteReportMutation');

describe('useDeleteReportMutation', () => {
  it('removes the detail cache and invalidates the reports list on success', async () => {
    deleteReport.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteReportMutation(), { wrapper: Wrapper });

    result.current.mutate('report-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['reports', 'detail', 'report-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
  });

  it('surfaces the error and skips cache updates on failure', async () => {
    deleteReport.mockRejectedValueOnce(new Error('Failed to delete report: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteReportMutation(), { wrapper: Wrapper });

    result.current.mutate('report-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to delete report: boom'));
    expect(removeSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
