import { describe, expect, it } from 'vitest';
import { getTaskById } from './get-task-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getTaskById', () => {
  it('returns the task with group name and author profile', async () => {
    const client = createSupabaseClientMock({
      tasks: {
        data: {
          id: 'task-1',
          title: 'Bring snacks',
          groups: { name: 'Group A' },
          profiles: { first_name: 'Ada', last_name: 'Lovelace' },
        },
        error: null,
      },
    });

    const result = await getTaskById(client as unknown as TypedSupabaseClient, 'task-1');

    expect(result).toEqual({
      id: 'task-1',
      title: 'Bring snacks',
      groups: { name: 'Group A' },
      profiles: { first_name: 'Ada', last_name: 'Lovelace' },
    });
  });

  it('returns null when no task is found', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: null },
    });

    const result = await getTaskById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: { message: 'boom' } },
    });

    await expect(getTaskById(client as unknown as TypedSupabaseClient, 'task-1')).rejects.toThrow(
      'Failed to fetch task: boom'
    );
  });
});
