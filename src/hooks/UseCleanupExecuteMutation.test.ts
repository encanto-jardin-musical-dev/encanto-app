import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const runCleanupExecute = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/admin/run-cleanup', () => ({
  runCleanupExecute: (...args: unknown[]) => runCleanupExecute(...args),
}));

const { useCleanupExecuteMutation } = await import('./UseCleanupExecuteMutation');

describe('useCleanupExecuteMutation', () => {
  it('runs the cleanup with the given cutoff and confirmation phrase', async () => {
    const response = { entities: { messages: 3 } };
    runCleanupExecute.mockResolvedValueOnce(response);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useCleanupExecuteMutation(), { wrapper: Wrapper });
    result.current.mutate({ cutoff: '2024-01-01', confirmationPhrase: 'DELETE' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(runCleanupExecute).toHaveBeenCalledWith({}, '2024-01-01', 'DELETE');
    expect(result.current.data).toEqual(response);
  });

  it('propagates errors', async () => {
    runCleanupExecute.mockRejectedValueOnce(new Error('Cleanup execute failed: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useCleanupExecuteMutation(), { wrapper: Wrapper });
    result.current.mutate({ cutoff: '2024-01-01', confirmationPhrase: 'DELETE' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Cleanup execute failed: boom'));
  });
});
