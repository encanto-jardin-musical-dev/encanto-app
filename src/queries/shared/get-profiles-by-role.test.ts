import { describe, expect, it } from 'vitest';
import { getProfilesByRole } from './get-profiles-by-role';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getProfilesByRole', () => {
  it('fetches profiles without avatar_url by default', async () => {
    const rows = [{ id: 'p1', first_name: 'Ada', last_name: 'Lovelace' }];
    const client = createSupabaseClientMock({ profiles: { data: rows, error: null } });

    const result = await getProfilesByRole(client as unknown as TypedSupabaseClient, 'teacher');

    const builder = client.from.mock.results[0].value;
    expect(builder.select).toHaveBeenCalledWith('id, first_name, last_name');
    expect(builder.eq).toHaveBeenCalledWith('role', 'teacher');
    expect(result).toEqual(rows);
  });

  it('includes avatar_url when withAvatar is true', async () => {
    const rows = [{ id: 'p1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null }];
    const client = createSupabaseClientMock({ profiles: { data: rows, error: null } });

    const result = await getProfilesByRole(client as unknown as TypedSupabaseClient, 'teacher', {
      withAvatar: true,
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.select).toHaveBeenCalledWith('id, first_name, last_name, avatar_url');
    expect(result).toEqual(rows);
  });

  it('returns an empty array when no rows are found', async () => {
    const client = createSupabaseClientMock({ profiles: { data: null, error: null } });

    const result = await getProfilesByRole(client as unknown as TypedSupabaseClient, 'admin');

    expect(result).toEqual([]);
  });

  it('throws with the role in the message when the query errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getProfilesByRole(client as unknown as TypedSupabaseClient, 'parent')
    ).rejects.toThrow("Failed to fetch profiles with role 'parent': boom");
  });
});
