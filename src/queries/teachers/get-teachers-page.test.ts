import { describe, expect, it } from 'vitest';
import { getTeachersPage } from './get-teachers-page';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getTeachersPage', () => {
  it('returns a page of teachers', async () => {
    const client = createSupabaseClientMock({
      profiles: {
        data: [
          { id: 'teacher-1', first_name: 'Ada', last_name: 'Lovelace', role: 'teacher', avatar_url: null },
        ],
        error: null,
      },
    });

    const result = await getTeachersPage(client as unknown as TypedSupabaseClient, {
      offset: 0,
      pageSize: 20,
    });

    expect(result).toEqual([
      { id: 'teacher-1', first_name: 'Ada', last_name: 'Lovelace', role: 'teacher', avatar_url: null },
    ]);
  });

  it('returns an empty array when there is no data', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: null },
    });

    const result = await getTeachersPage(client as unknown as TypedSupabaseClient, {
      offset: 0,
      pageSize: 20,
    });

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getTeachersPage(client as unknown as TypedSupabaseClient, { offset: 0, pageSize: 20 })
    ).rejects.toThrow('Failed to fetch teachers page: boom');
  });
});
