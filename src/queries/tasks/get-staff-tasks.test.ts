import { describe, expect, it } from 'vitest';
import { getStaffTasks } from './get-staff-tasks';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getStaffTasks', () => {
  it('returns tasks across all groups when no teacherId is given (admin)', async () => {
    const client = createSupabaseClientMock({
      tasks: {
        data: [{ id: 'task-1', groups: { name: 'Group A' } }],
        error: null,
      },
    });

    const result = await getStaffTasks(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([{ id: 'task-1', groups: { name: 'Group A' } }]);
  });

  it("scopes to the given teacher's groups", async () => {
    const client = createSupabaseClientMock({
      tasks: {
        data: [{ id: 'task-1', groups: { name: 'Group A' } }],
        error: null,
      },
    });

    const result = await getStaffTasks(client as unknown as TypedSupabaseClient, {
      teacherId: 'teacher-1',
    });

    expect(result).toEqual([{ id: 'task-1', groups: { name: 'Group A' } }]);
  });

  it('returns an empty array when there is no data', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: null },
    });

    const result = await getStaffTasks(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      tasks: { data: null, error: { message: 'boom' } },
    });

    await expect(getStaffTasks(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch staff tasks: boom'
    );
  });
});
