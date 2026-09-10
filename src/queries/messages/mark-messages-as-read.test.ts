import { describe, expect, it } from 'vitest';
import { markMessagesAsRead } from './mark-messages-as-read';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('markMessagesAsRead', () => {
  it('updates the message as read and resolves the row', async () => {
    const updated = [{ id: 'msg-1', is_read: true }];
    const client = createSupabaseClientMock({ messages: { data: updated, error: null } });

    const result = await markMessagesAsRead(client as unknown as TypedSupabaseClient, 'msg-1');

    expect(client.from).toHaveBeenCalledWith('messages');
    expect(result).toEqual({ data: updated, error: null });
  });

  it('passes through an update error unchanged', async () => {
    const client = createSupabaseClientMock({
      messages: { data: null, error: { message: 'boom' } },
    });

    const result = await markMessagesAsRead(client as unknown as TypedSupabaseClient, 'msg-1');

    expect(result).toEqual({ data: null, error: { message: 'boom' } });
  });
});
