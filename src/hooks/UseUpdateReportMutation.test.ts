import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const updateReport = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/update-report', () => ({
  updateReport: (...args: unknown[]) => updateReport(...args),
}));

const { default: useUpdateReportMutation } = await import('./UseUpdateReportMutation');

describe('useUpdateReportMutation', () => {
  it('invalidates the reports cache on success', async () => {
    updateReport.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateReportMutation(), { wrapper: Wrapper });

    result.current.mutate({ reportId: 'report-1', title: 'Updated', groupId: 'group-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    updateReport.mockRejectedValueOnce(new Error('Failed to update report: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateReportMutation(), { wrapper: Wrapper });

    result.current.mutate({ reportId: 'report-1', title: 'Updated', groupId: 'group-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to update report: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
