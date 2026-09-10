import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getAvailableTeachers = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/groups/get-available-teachers', () => ({
  getAvailableTeachers: (...args: unknown[]) => getAvailableTeachers(...args),
}));

const { default: useAvailableTeachersQuery } = await import('./UseAvailableTeachersQuery');

describe('useAvailableTeachersQuery', () => {
  it('is disabled when enabled=false', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useAvailableTeachersQuery(false), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getAvailableTeachers).not.toHaveBeenCalled();
  });

  it('returns teachers on success when enabled', async () => {
    getAvailableTeachers.mockResolvedValueOnce([{ id: 't1', first_name: 'Grace', last_name: 'Hopper' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAvailableTeachersQuery(true), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 't1', first_name: 'Grace', last_name: 'Hopper' }]);
  });

  it('propagates errors', async () => {
    getAvailableTeachers.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAvailableTeachersQuery(true), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
