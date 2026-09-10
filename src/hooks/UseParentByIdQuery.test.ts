import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getParentById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/parents/get-parent-by-id', () => ({
  getParentById: (...args: unknown[]) => getParentById(...args),
}));

const { default: useParentByIdQuery } = await import('./UseParentByIdQuery');

describe('useParentByIdQuery', () => {
  it('is disabled when parentID is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useParentByIdQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getParentById).not.toHaveBeenCalled();
  });

  it('fetches and returns the parent on success', async () => {
    getParentById.mockResolvedValueOnce({ id: 'parent-1' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useParentByIdQuery('parent-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'parent-1' });
  });

  it('propagates query errors', async () => {
    getParentById.mockRejectedValueOnce(new Error('Failed to fetch parent: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useParentByIdQuery('parent-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch parent: boom'));
  });
});
