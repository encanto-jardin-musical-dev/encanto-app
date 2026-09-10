import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';
import { todayDateString } from '@/utils/dates';

const clockOutChildren = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/attendance/clock-out-children', () => ({
  clockOutChildren: (...args: unknown[]) => clockOutChildren(...args),
}));

const { useAdminCheckOutMutation } = await import('./UseAdminCheckOutMutation');

describe('useAdminCheckOutMutation', () => {
  it('clocks out a single child and invalidates today’s attendance overview on success', async () => {
    clockOutChildren.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAdminCheckOutMutation(), { wrapper: Wrapper });
    result.current.mutate('child-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(clockOutChildren).toHaveBeenCalledWith({}, ['child-1']);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin-attendance-overview', todayDateString()],
    });
  });

  it('skips cache invalidation on failure', async () => {
    clockOutChildren.mockRejectedValueOnce(new Error('Failed to clock out children: boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAdminCheckOutMutation(), { wrapper: Wrapper });
    result.current.mutate('child-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to clock out children: boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
