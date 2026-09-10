import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const runCleanupPreview = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/admin/run-cleanup', () => ({
  runCleanupPreview: (...args: unknown[]) => runCleanupPreview(...args),
}));

const { useCleanupPreviewMutation } = await import('./UseCleanupPreviewMutation');

describe('useCleanupPreviewMutation', () => {
  it('resolves the preview response on success', async () => {
    const response = { cutoff: '2024-01-01', entities: { messages: 3 } };
    runCleanupPreview.mockResolvedValueOnce(response);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useCleanupPreviewMutation(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(runCleanupPreview).toHaveBeenCalledWith({});
    expect(result.current.data).toEqual(response);
  });

  it('propagates errors', async () => {
    runCleanupPreview.mockRejectedValueOnce(new Error('Cleanup preview failed: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useCleanupPreviewMutation(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Cleanup preview failed: boom'));
  });
});
