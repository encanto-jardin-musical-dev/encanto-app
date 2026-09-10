import { describe, expect, it } from 'vitest';
import { getUserGroups } from './get-user-groups';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getUserGroups', () => {
  it('maps rows to their nested group and filters out null groups', async () => {
    const client = createSupabaseClientMock({
      group_teachers: {
        data: [
          { groups: { id: 'group-1', name: 'Group A' } },
          { groups: null },
          { groups: { id: 'group-2', name: 'Group B' } },
        ],
        error: null,
      },
    });

    const result = await getUserGroups(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(result).toEqual({
      data: [
        { id: 'group-1', name: 'Group A' },
        { id: 'group-2', name: 'Group B' },
      ],
      error: null,
    });
  });

  it('filters by teacher_id', async () => {
    const client = createSupabaseClientMock({
      group_teachers: { data: [], error: null },
    });

    await getUserGroups(client as unknown as TypedSupabaseClient, 'teacher-1');

    const builder = client.from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith('teacher_id', 'teacher-1');
  });

  it('returns the error without throwing when the query fails', async () => {
    const client = createSupabaseClientMock({
      group_teachers: { data: null, error: { message: 'connection lost' } },
    });

    const result = await getUserGroups(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(result).toEqual({ data: null, error: { message: 'connection lost' } });
  });
});
