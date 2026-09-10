import { describe, expect, it } from 'vitest';
import { getTeacherById } from './get-teacher-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getTeacherById', () => {
  it('maps a teacher row with nested groups', async () => {
    const client = createSupabaseClientMock({
      profiles: {
        data: [
          {
            id: 'teacher-1',
            first_name: 'Ada',
            last_name: 'Lovelace',
            document_type: 'cc',
            document_number: '123',
            role: 'teacher',
            phone: null,
            avatar_url: null,
            group_teachers: [{ groups: { id: 'group-1', name: 'Group A', image_url: null } }],
          },
        ],
        error: null,
      },
    });

    const result = await getTeacherById(client as unknown as TypedSupabaseClient, 'teacher-1');

    expect(result).toEqual({
      id: 'teacher-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      role: 'teacher',
      phone: null,
      avatar_url: null,
      groups: [{ id: 'group-1', name: 'Group A', image_url: null }],
    });
  });

  it('returns null when no row is found', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: [], error: null },
    });

    const result = await getTeacherById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getTeacherById(client as unknown as TypedSupabaseClient, 'teacher-1')
    ).rejects.toThrow('Failed to fetch teacher: boom');
  });
});
