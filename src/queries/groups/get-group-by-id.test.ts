import { describe, expect, it } from 'vitest';
import { getGroupById } from './get-group-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupById', () => {
  it('maps a group row with nested teachers and children', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            name: 'Group A',
            image_url: null,
            group_teachers: [{ profiles: { id: 'teacher-1', first_name: 'Grace', last_name: 'Hopper' } }],
            child_groups: [
              { children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null } },
            ],
          },
        ],
        error: null,
      },
    });

    const result = await getGroupById(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual({
      id: 'group-1',
      name: 'Group A',
      image_url: null,
      teachers: [{ id: 'teacher-1', first_name: 'Grace', last_name: 'Hopper' }],
      children: [{ id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null }],
    });
  });

  it('returns null when the group is not found', async () => {
    const client = createSupabaseClientMock({ groups: { data: [], error: null } });

    const result = await getGroupById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(getGroupById(client as unknown as TypedSupabaseClient, 'group-1')).rejects.toThrow(
      'Failed to fetch group: boom'
    );
  });
});
