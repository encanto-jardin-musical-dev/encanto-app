import { describe, expect, it } from 'vitest';
import { getGroupChildren } from './get-group-children';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupChildren', () => {
  it('returns the group children ordered by name', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'g1',
            child_groups: [
              { children: { id: 'c2', first_name: 'Sofía', last_name: 'Gómez' } },
              { children: { id: 'c1', first_name: 'Ana', last_name: 'Pérez' } },
              { children: null },
            ],
          },
        ],
        error: null,
      },
    });

    const result = await getGroupChildren(client as unknown as TypedSupabaseClient, 'g1');

    expect(client.from).toHaveBeenCalledWith('groups');
    expect(client.from.mock.results[0].value.eq).toHaveBeenCalledWith('id', 'g1');
    expect(result.map((c) => c.id)).toEqual(['c1', 'c2']);
  });

  it('returns an empty array when the group has no children or is missing', async () => {
    const client = createSupabaseClientMock({ groups: { data: [], error: null } });

    expect(await getGroupChildren(client as unknown as TypedSupabaseClient, 'g1')).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getGroupChildren(client as unknown as TypedSupabaseClient, 'g1')
    ).rejects.toThrow('Failed to fetch group children: boom');
  });
});
