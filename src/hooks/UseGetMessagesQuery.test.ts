import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';
import { MESSAGES_PAGE_SIZE } from '@/lib/const';

const getMessagesPage = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}));
vi.mock('@/queries/messages/get-messages', () => ({
  getMessagesPage: (...args: unknown[]) => getMessagesPage(...args),
}));

const { default: UseGetMessagesQuery, getMessagesQueryKey } = await import('./UseGetMessagesQuery');

function makeMessage(id: string, created_at: string) {
  return { message_id: id, message_content: id, message_created_at: created_at };
}

describe('getMessagesQueryKey', () => {
  it('scopes the key by current user and thread', () => {
    expect(getMessagesQueryKey('user-1', 'thread-1')).toEqual(['messages', 'user-1', 'thread-1']);
  });
});

describe('UseGetMessagesQuery', () => {
  it('is disabled when currentUserId or threadId is missing', () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(
      () => UseGetMessagesQuery({ currentUserId: '', threadId: 'thread-1' }),
      { wrapper: Wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getMessagesPage).not.toHaveBeenCalled();
  });

  it('returns undefined nextPageParam (no more pages) when a page is short of the page size', async () => {
    const page = [makeMessage('m1', '2024-01-02T00:00:00Z')];
    getMessagesPage.mockResolvedValueOnce(page);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => UseGetMessagesQuery({ currentUserId: 'user-1', threadId: 'thread-1' }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('cursors on the oldest message and flattens pages oldest-first', async () => {
    const fullPage = Array.from({ length: MESSAGES_PAGE_SIZE }, (_, i) =>
      makeMessage(`m${i}`, `2024-01-${String(20 - i).padStart(2, '0')}T00:00:00Z`)
    );
    const nextPage = [makeMessage('m-older', '2024-01-01T00:00:00Z')];

    getMessagesPage.mockResolvedValueOnce(fullPage).mockResolvedValueOnce(nextPage);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => UseGetMessagesQuery({ currentUserId: 'user-1', threadId: 'thread-1' }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

    expect(getMessagesPage).toHaveBeenLastCalledWith(
      {},
      expect.objectContaining({ cursor: fullPage[fullPage.length - 1].message_created_at })
    );

    // Oldest message (from the second, older page) comes first.
    expect(result.current.messages[0].message_id).toBe('m-older');
    expect(result.current.messages.at(-1)?.message_id).toBe('m0');
  });

  it('propagates errors from the underlying query', async () => {
    getMessagesPage.mockRejectedValueOnce(new Error('Failed to fetch messages page: boom'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => UseGetMessagesQuery({ currentUserId: 'user-1', threadId: 'thread-1' }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to fetch messages page: boom'));
  });
});
