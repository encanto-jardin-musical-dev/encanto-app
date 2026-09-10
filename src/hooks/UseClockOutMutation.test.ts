import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const clockOutChildren = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/clock-out-children', () => ({
  clockOutChildren: (...args: unknown[]) => clockOutChildren(...args),
}));

const { default: useClockOutMutation } = await import('./UseClockOutMutation');

describe('useClockOutMutation', () => {
  it('invalidates group-attendance for the given group on success', async () => {
    clockOutChildren.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useClockOutMutation('group-1'), { wrapper: Wrapper });

    result.current.mutate(['child-1']);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['group-attendance', 'group-1'] });
  });

  it('does not invalidate on failure', async () => {
    clockOutChildren.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useClockOutMutation('group-1'), { wrapper: Wrapper });

    result.current.mutate(['child-1']);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
