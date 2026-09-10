import { describe, expect, it } from 'vitest';
import { createTask } from './create-task';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('createTask', () => {
  it('inserts a task with defaults applied for optional fields', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: null },
    });

    await createTask(client as unknown as TypedSupabaseClient, {
      title: 'Bring snacks',
      groupId: 'group-1',
      teacherId: 'teacher-1',
    });

    expect(client.from).toHaveBeenCalledWith('tasks');
  });

  it('throws when the insert errors', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: { message: 'constraint violation' } },
    });

    await expect(
      createTask(client as unknown as TypedSupabaseClient, {
        title: 'Bring snacks',
        groupId: 'group-1',
        teacherId: 'teacher-1',
      })
    ).rejects.toThrow('Failed to create task: constraint violation');
  });
});
