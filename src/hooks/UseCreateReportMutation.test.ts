import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const createReport = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/create-report', () => ({
  createReport: (...args: unknown[]) => createReport(...args),
}));

const { default: useCreateReportMutation } = await import('./UseCreateReportMutation');

describe('useCreateReportMutation', () => {
  it('invalidates the reports cache on success', async () => {
    createReport.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateReportMutation(), { wrapper: Wrapper });

    result.current.mutate({ title: 'Nap time', groupId: 'group-1', teacherId: 'teacher-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
  });

  it('surfaces the error and skips cache invalidation on failure', async () => {
    createReport.mockRejectedValueOnce(new Error('Failed to create report: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateReportMutation(), { wrapper: Wrapper });

    result.current.mutate({ title: 'Nap time', groupId: 'group-1', teacherId: 'teacher-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to create report: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
