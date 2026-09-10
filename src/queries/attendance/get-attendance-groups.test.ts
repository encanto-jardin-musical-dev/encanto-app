import { describe, expect, it } from 'vitest';
import { getAttendanceGroups } from './get-attendance-groups';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getAttendanceGroups', () => {
  it('returns all groups (with null image_url passed through) when no teacherId is given', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          { id: 'group-1', name: 'Group A', image_url: null },
          { id: 'group-2', name: 'Group B', image_url: null },
        ],
        error: null,
      },
    });

    const result = await getAttendanceGroups(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([
      { id: 'group-1', name: 'Group A', image_url: null },
      { id: 'group-2', name: 'Group B', image_url: null },
    ]);
  });

  it('filters by teacherId via the group_teachers inner join', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [{ id: 'group-1', name: 'Group A', image_url: null }],
        error: null,
      },
    });

    await getAttendanceGroups(client as unknown as TypedSupabaseClient, { teacherId: 'teacher-1' });

    const builder = client.from.mock.results[0].value;
    expect(client.from).toHaveBeenCalledWith('groups');
    expect(builder.select).toHaveBeenCalledWith(
      'id, name, image_url, group_teachers!inner(teacher_id)'
    );
    expect(builder.eq).toHaveBeenCalledWith('group_teachers.teacher_id', 'teacher-1');
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(getAttendanceGroups(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch attendance groups: boom'
    );
  });
});
