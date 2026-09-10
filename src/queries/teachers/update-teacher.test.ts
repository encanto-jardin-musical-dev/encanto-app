import { describe, expect, it } from 'vitest';
import { updateTeacher } from './update-teacher';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('updateTeacher', () => {
  it('updates the profile and reconciles group links', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: null },
      group_teachers: { data: [], error: null },
    });

    await updateTeacher(client as unknown as TypedSupabaseClient, {
      id: 'teacher-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
      groupIds: ['group-1'],
    });

    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(client.from).toHaveBeenCalledWith('group_teachers');
  });

  it('throws when the profile update errors, without reconciling links', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(
      updateTeacher(client as unknown as TypedSupabaseClient, {
        id: 'teacher-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
        document_type: 'cc',
        document_number: '123',
        role: 'teacher',
        groupIds: ['group-1'],
      })
    ).rejects.toThrow('Failed to update teacher: boom');

    expect(client.from).not.toHaveBeenCalledWith('group_teachers');
  });
});
