import { describe, expect, it } from 'vitest';
import { getParentsPage } from './get-parents-page';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getParentsPage', () => {
  it('maps parent rows with their nested children', async () => {
    const client = createSupabaseClientMock({
      profiles: {
        data: [
          {
            id: 'parent-1',
            first_name: 'Grace',
            last_name: 'Hopper',
            role: 'parent',
            avatar_url: null,
            child_guardians: [{ children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' } }],
          },
        ],
        error: null,
      },
    });

    const result = await getParentsPage(client as unknown as TypedSupabaseClient, {
      offset: 0,
      pageSize: 20,
    });

    expect(result).toEqual([
      {
        id: 'parent-1',
        first_name: 'Grace',
        last_name: 'Hopper',
        role: 'parent',
        avatar_url: null,
        children: [{ id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' }],
      },
    ]);
  });

  it('applies a search filter when given', async () => {
    const client = createSupabaseClientMock({ profiles: { data: [], error: null } });

    await getParentsPage(client as unknown as TypedSupabaseClient, {
      search: 'grace',
      offset: 0,
      pageSize: 20,
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.or).toHaveBeenCalledWith('first_name.ilike.%grace%,last_name.ilike.%grace%');
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getParentsPage(client as unknown as TypedSupabaseClient, { offset: 0, pageSize: 20 })
    ).rejects.toThrow('Failed to fetch parents page: boom');
  });
});
