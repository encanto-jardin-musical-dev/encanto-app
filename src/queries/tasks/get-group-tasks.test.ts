import { describe, expect, it } from 'vitest';
import { getGroupTasks } from './get-group-tasks';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupTasks', () => {
  it('returns tasks for the group', async () => {
    const client = createSupabaseClientMock({
      tasks: {
        data: [{ id: 'task-1', title: 'Bring snacks', group_id: 'group-1' }],
        error: null,
      },
    });

    const result = await getGroupTasks(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual([{ id: 'task-1', title: 'Bring snacks', group_id: 'group-1' }]);
  });

  it('returns an empty array when there is no data', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: null },
    });

    const result = await getGroupTasks(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getGroupTasks(client as unknown as TypedSupabaseClient, 'group-1')
    ).rejects.toThrow('Failed to fetch group tasks: boom');
  });
});
