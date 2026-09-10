import { describe, expect, it } from 'vitest';
import { sendMessage } from './send-messages';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('sendMessage', () => {
  it('inserts the message, defaulting receiver/group to null and dropping empty attachments', async () => {
    const inserted = { id: 'msg-1', content: 'hi' };
    const client = createSupabaseClientMock({ messages: { data: inserted, error: null } });

    const result = await sendMessage(client as unknown as TypedSupabaseClient, {
      content: 'hi',
      sender_id: 'user-1',
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.insert).toHaveBeenCalledWith([
      {
        content: 'hi',
        sender_id: 'user-1',
        receiver_id: null,
        group_id: null,
        attachments: null,
      },
    ]);
    expect(result).toEqual({ data: inserted, error: null });
  });

  it('includes attachments when provided', async () => {
    const client = createSupabaseClientMock({ messages: { data: {}, error: null } });
    const attachments = [{ key: 'a.png', contentType: 'image/png', size: 10, name: 'a.png' }];

    await sendMessage(
      client as unknown as TypedSupabaseClient,
      { content: 'hi', sender_id: 'user-1', receiver_id: 'user-2', group_id: 'group-1' },
      attachments
    );

    const builder = client.from.mock.results[0].value;
    expect(builder.insert).toHaveBeenCalledWith([
      {
        content: 'hi',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        group_id: 'group-1',
        attachments,
      },
    ]);
  });

  it('passes through an insert error unchanged', async () => {
    const client = createSupabaseClientMock({
      messages: { data: null, error: { message: 'boom' } },
    });

    const result = await sendMessage(client as unknown as TypedSupabaseClient, {
      content: 'hi',
      sender_id: 'user-1',
    });

    expect(result).toEqual({ data: null, error: { message: 'boom' } });
  });
});
