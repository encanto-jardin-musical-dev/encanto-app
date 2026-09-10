import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getFeedUserMessages = vi.fn();

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('@/queries/feed/get-feed-user-messages', () => ({
  getFeedUserMessages: (...args: unknown[]) => getFeedUserMessages(...args),
}));

const { default: useGetUserFeedMessages } = await import('./UseGetUserFeedMessages');

describe('useGetUserFeedMessages', () => {
  it('honors options.enabled to gate the query', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () =>
        useGetUserFeedMessages({
          params: { userID: 'user-1', groupID: 'group-1' },
          options: { enabled: false },
        }),
      { wrapper: Wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getFeedUserMessages).not.toHaveBeenCalled();
  });

  it('resolves the message data on success', async () => {
    getFeedUserMessages.mockResolvedValueOnce({ data: [{ message_id: 'm1' }], error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useGetUserFeedMessages({ params: { userID: 'user-1', groupID: 'group-1' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getFeedUserMessages).toHaveBeenCalledWith({}, { userID: 'user-1', groupID: 'group-1' });
    expect(result.current.data).toEqual([{ message_id: 'm1' }]);
  });

  it('propagates a rejected query as an error', async () => {
    getFeedUserMessages.mockRejectedValueOnce(new Error('network down'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useGetUserFeedMessages({ params: { userID: 'user-1', groupID: 'group-1' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('network down'));
  });
});
