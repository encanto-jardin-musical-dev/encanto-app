import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getAttendedChildren = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/reports/get-attended-children', () => ({
  getAttendedChildren: (...args: unknown[]) => getAttendedChildren(...args),
}));

const { default: useAttendedChildrenQuery } = await import('./UseAttendedChildrenQuery');

describe('useAttendedChildrenQuery', () => {
  it('is disabled when groupId or date is missing', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useAttendedChildrenQuery('', '2024-01-01'), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getAttendedChildren).not.toHaveBeenCalled();
  });

  it('fetches and returns attended children on success', async () => {
    getAttendedChildren.mockResolvedValueOnce([{ id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendedChildrenQuery('group-1', '2024-01-01'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' }]);
  });

  it('propagates query errors', async () => {
    getAttendedChildren.mockRejectedValueOnce(new Error('Failed to fetch group children: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttendedChildrenQuery('group-1', '2024-01-01'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch group children: boom'));
  });
});
