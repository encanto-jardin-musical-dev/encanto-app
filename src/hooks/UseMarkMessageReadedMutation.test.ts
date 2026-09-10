import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const markMessagesAsRead = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/messages/mark-messages-as-read', () => ({
  markMessagesAsRead: (...args: unknown[]) => markMessagesAsRead(...args),
}));

const { default: useMarkMessageRead } = await import('./UseMarkMessageReadedMutation');

describe('useMarkMessageRead', () => {
  it('resolves the updated row data on success', async () => {
    markMessagesAsRead.mockResolvedValueOnce({ data: [{ id: 'msg-1', is_read: true }], error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useMarkMessageRead(), { wrapper: Wrapper });
    result.current.mutate('msg-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(markMessagesAsRead).toHaveBeenCalledWith({}, 'msg-1');
    expect(result.current.data).toEqual([{ id: 'msg-1', is_read: true }]);
  });

  it('propagates a rejected mutation as an error', async () => {
    markMessagesAsRead.mockRejectedValueOnce(new Error('network down'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useMarkMessageRead(), { wrapper: Wrapper });
    result.current.mutate('msg-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('network down'));
  });
});
