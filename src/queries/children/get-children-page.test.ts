import { describe, expect, it } from 'vitest';
import { getChildrenPage } from './get-children-page';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getChildrenPage', () => {
  it('maps rows and derives parentName from the first guardian', async () => {
    const client = createSupabaseClientMock({
      children: {
        data: [
          {
            id: 'child-1',
            first_name: 'Ada',
            last_name: 'Lovelace',
            avatar_url: null,
            child_guardians: [{ profiles: { first_name: 'Grace', last_name: 'Hopper' } }],
          },
          {
            id: 'child-2',
            first_name: 'Alan',
            last_name: 'Turing',
            avatar_url: null,
            child_guardians: [],
          },
        ],
        error: null,
      },
    });

    const result = await getChildrenPage(client as unknown as TypedSupabaseClient, {
      offset: 0,
      pageSize: 20,
    });

    expect(result).toEqual([
      { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null, parentName: 'Grace Hopper' },
      { id: 'child-2', first_name: 'Alan', last_name: 'Turing', avatar_url: null, parentName: null },
    ]);
  });

  it('applies a search filter when provided', async () => {
    const client = createSupabaseClientMock({ children: { data: [], error: null } });

    await getChildrenPage(client as unknown as TypedSupabaseClient, {
      search: 'ada',
      offset: 0,
      pageSize: 20,
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.or).toHaveBeenCalledWith('first_name.ilike.%ada%,last_name.ilike.%ada%');
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getChildrenPage(client as unknown as TypedSupabaseClient, { offset: 0, pageSize: 20 })
    ).rejects.toThrow('Failed to fetch children page: boom');
  });
});
