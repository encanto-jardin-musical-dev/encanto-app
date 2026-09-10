import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getGroupById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/groups/get-group-by-id', () => ({
  getGroupById: (...args: unknown[]) => getGroupById(...args),
}));

const { default: useGroupByIdQuery } = await import('./UseGroupByIdQuery');

describe('useGroupByIdQuery', () => {
  it('is disabled when groupID is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useGroupByIdQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getGroupById).not.toHaveBeenCalled();
  });

  it('returns the group on success', async () => {
    getGroupById.mockResolvedValueOnce({ id: 'group-1', name: 'A' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupByIdQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'group-1', name: 'A' });
  });

  it('propagates errors', async () => {
    getGroupById.mockRejectedValueOnce(new Error('boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useGroupByIdQuery('group-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
