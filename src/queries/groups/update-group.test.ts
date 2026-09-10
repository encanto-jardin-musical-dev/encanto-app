import { describe, expect, it } from 'vitest';
import { updateGroup } from './update-group';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('updateGroup', () => {
  it('updates the group and reconciles teacher links', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: null },
      group_teachers: { data: [], error: null },
    });

    await updateGroup(client as unknown as TypedSupabaseClient, {
      id: 'group-1',
      name: 'Group A',
      teacherIds: ['teacher-1'],
    });

    expect(client.from).toHaveBeenCalledWith('groups');
    expect(client.from).toHaveBeenCalledWith('group_teachers');
  });

  it('throws when the update errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'not found' } },
    });

    await expect(
      updateGroup(client as unknown as TypedSupabaseClient, {
        id: 'group-1',
        name: 'Group A',
        teacherIds: [],
      })
    ).rejects.toThrow('Failed to update group: not found');
  });
});
