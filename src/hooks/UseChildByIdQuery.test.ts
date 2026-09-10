import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getChildById = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/children/get-child-by-id', () => ({
  getChildById: (...args: unknown[]) => getChildById(...args),
}));

// Imported after the mocks above so the hook picks up the mocked modules.
const { default: useChildByIdQuery } = await import('./UseChildByIdQuery');

describe('useChildByIdQuery', () => {
  it('is disabled when childID is empty', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useChildByIdQuery(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getChildById).not.toHaveBeenCalled();
  });

  it('fetches and returns the child on success', async () => {
    getChildById.mockResolvedValueOnce({ id: 'child-1', first_name: 'Ada' });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildByIdQuery('child-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'child-1', first_name: 'Ada' });
  });

  it('propagates query errors', async () => {
    getChildById.mockRejectedValueOnce(new Error('Failed to fetch child: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChildByIdQuery('child-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch child: boom'));
  });
});
