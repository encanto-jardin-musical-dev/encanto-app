import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const clockInChildren = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/clock-in-children', () => ({
  clockInChildren: (...args: unknown[]) => clockInChildren(...args),
}));

const { default: useClockInMutation } = await import('./UseClockInMutation');

describe('useClockInMutation', () => {
  it('invalidates group-attendance for the given group on success', async () => {
    clockInChildren.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useClockInMutation('group-1'), { wrapper: Wrapper });

    result.current.mutate(['child-1']);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['group-attendance', 'group-1'] });
  });

  it('does not invalidate on failure', async () => {
    clockInChildren.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useClockInMutation('group-1'), { wrapper: Wrapper });

    result.current.mutate(['child-1']);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
