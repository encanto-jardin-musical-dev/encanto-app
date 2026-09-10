import { describe, expect, it } from 'vitest';
import { updateTask } from './update-task';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('updateTask', () => {
  it('updates the task by id', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: null },
    });

    await updateTask(client as unknown as TypedSupabaseClient, {
      taskId: 'task-1',
      title: 'Updated title',
      groupId: 'group-1',
    });

    expect(client.from).toHaveBeenCalledWith('tasks');
  });

  it('throws when the update errors', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: { message: 'boom' } },
    });

    await expect(
      updateTask(client as unknown as TypedSupabaseClient, {
        taskId: 'task-1',
        title: 'Updated title',
        groupId: 'group-1',
      })
    ).rejects.toThrow('Failed to update task: boom');
  });
});
