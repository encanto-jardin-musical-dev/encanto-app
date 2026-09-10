import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const sendMessage = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/messages/send-messages', () => ({
  sendMessage: (...args: unknown[]) => sendMessage(...args),
}));

const { default: useSendMessage } = await import('./UseSendMessageMutation');

describe('useSendMessage', () => {
  it('sends the message with its attachments', async () => {
    sendMessage.mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null });
    const { Wrapper } = createQueryClientWrapper();
    const message = { content: 'hi', sender_id: 'user-1', receiver_id: 'user-2' };
    const attachments = [{ key: 'a.png', contentType: 'image/png', size: 1, name: 'a.png' }];

    const { result } = renderHook(() => useSendMessage(), { wrapper: Wrapper });
    result.current.mutate({ message, attachments });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(sendMessage).toHaveBeenCalledWith({}, message, attachments);
    expect(result.current.data).toEqual({ data: { id: 'msg-1' }, error: null });
  });

  it('propagates a rejected mutation as an error', async () => {
    sendMessage.mockRejectedValueOnce(new Error('network down'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useSendMessage(), { wrapper: Wrapper });
    result.current.mutate({ message: { content: 'hi', sender_id: 'user-1' } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('network down'));
  });
});
