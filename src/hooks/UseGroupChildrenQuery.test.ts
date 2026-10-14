import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getGroupChildren = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/attendance/get-group-children', () => ({
  getGroupChildren: (...args: unknown[]) => getGroupChildren(...args),
}));

const { default: useGroupChildrenQuery } = await import('./UseGroupChildrenQuery');

describe('useGroupChildrenQuery', () => {
  it('is disabled without a groupId', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupChildrenQuery(undefined), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupChildren).not.toHaveBeenCalled();
  });

  it('fetches the group children', async () => {
    getGroupChildren.mockResolvedValueOnce([{ id: 'c1', first_name: 'Ana', last_name: 'P' }]);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupChildrenQuery('g1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getGroupChildren).toHaveBeenCalledWith({}, 'g1');
    expect(result.current.data).toHaveLength(1);
  });

  it('propagates errors', async () => {
    getGroupChildren.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupChildrenQuery('g1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
