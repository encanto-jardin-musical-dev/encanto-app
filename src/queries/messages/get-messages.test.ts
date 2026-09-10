import { describe, expect, it } from 'vitest';
import { getMessagesPage } from './get-messages';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getMessagesPage', () => {
  it('filters a direct thread by sender/receiver in both directions', async () => {
    const client = createSupabaseClientMock({
      detailed_messages: {
        data: [{ message_id: 'm1', message_created_at: '2024-01-02T00:00:00Z' }],
        error: null,
      },
    });

    const result = await getMessagesPage(client as unknown as TypedSupabaseClient, {
      currentUserId: 'user-1',
      threadId: 'user-2',
    });

    const builder = client.from.mock.results[0].value;
    expect(client.from).toHaveBeenCalledWith('detailed_messages');
    expect(builder.or).toHaveBeenCalledWith(
      'and(sender_id.eq.user-1,receiver_id.eq.user-2),and(sender_id.eq.user-2,receiver_id.eq.user-1)'
    );
    expect(result).toEqual([{ message_id: 'm1', message_created_at: '2024-01-02T00:00:00Z' }]);
  });

  it('filters a group thread by group_id', async () => {
    const client = createSupabaseClientMock({
      detailed_messages: { data: [], error: null },
    });

    await getMessagesPage(client as unknown as TypedSupabaseClient, {
      currentUserId: 'user-1',
      threadId: 'group-1',
      kind: 'group',
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith('group_id', 'group-1');
  });

  it('applies the cursor when provided', async () => {
    const client = createSupabaseClientMock({
      detailed_messages: { data: [], error: null },
    });

    await getMessagesPage(client as unknown as TypedSupabaseClient, {
      currentUserId: 'user-1',
      threadId: 'group-1',
      kind: 'group',
      cursor: '2024-01-01T00:00:00Z',
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.lt).toHaveBeenCalledWith('message_created_at', '2024-01-01T00:00:00Z');
  });

  it('returns an empty array when there is no data', async () => {
    const client = createSupabaseClientMock({
      detailed_messages: { data: null, error: null },
    });

    const result = await getMessagesPage(client as unknown as TypedSupabaseClient, {
      currentUserId: 'user-1',
      threadId: 'user-2',
    });

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      detailed_messages: { data: null, error: { message: 'timeout' } },
    });

    await expect(
      getMessagesPage(client as unknown as TypedSupabaseClient, {
        currentUserId: 'user-1',
        threadId: 'user-2',
      })
    ).rejects.toThrow('Failed to fetch messages page: timeout');
  });
});
