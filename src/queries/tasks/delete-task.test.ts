import { describe, expect, it } from 'vitest';
import { deleteTask } from './delete-task';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('deleteTask', () => {
  it('deletes the task by id', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: null },
    });

    await deleteTask(client as unknown as TypedSupabaseClient, 'task-1');

    expect(client.from).toHaveBeenCalledWith('tasks');
  });

  it('throws when the delete errors', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: { message: 'not found' } },
    });

    await expect(deleteTask(client as unknown as TypedSupabaseClient, 'task-1')).rejects.toThrow(
      'Failed to delete task: not found'
    );
  });
});
