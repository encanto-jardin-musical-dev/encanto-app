import { describe, expect, it } from 'vitest';
import { getFeedUserMessages } from './get-feed-user-messages';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getFeedUserMessages', () => {
  it('queries detailed_messages scoped to the user and group', async () => {
    const messages = [{ message_id: 'm1' }];
    const client = createSupabaseClientMock({ detailed_messages: { data: messages, error: null } });

    const result = await getFeedUserMessages(client as unknown as TypedSupabaseClient, {
      userID: 'user-1',
      groupID: 'group-1',
    });

    const builder = client.from.mock.results[0].value;
    expect(client.from).toHaveBeenCalledWith('detailed_messages');
    expect(builder.eq).toHaveBeenCalledWith('receiver_id', 'user-1');
    expect(builder.or).toHaveBeenCalledWith('group_id.is.null, group_id.eq.group-1');
    expect(result).toEqual({ data: messages, error: null });
  });

  it('passes through a query error unchanged', async () => {
    const client = createSupabaseClientMock({
      detailed_messages: { data: null, error: { message: 'boom' } },
    });

    const result = await getFeedUserMessages(client as unknown as TypedSupabaseClient, {
      userID: 'user-1',
      groupID: 'group-1',
    });

    expect(result).toEqual({ data: null, error: { message: 'boom' } });
  });
});
