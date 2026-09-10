import { describe, expect, it } from 'vitest';
import { getProfileById } from './get-profile-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getProfileById', () => {
  it('returns the mapped profile on success', async () => {
    const client = createSupabaseClientMock({
      profiles: {
        data: {
          id: 'user-1',
          first_name: 'Ada',
          last_name: 'Lovelace',
          role: 'parent',
          avatar_url: null,
        },
        error: null,
      },
    });

    const result = await getProfileById(client as unknown as TypedSupabaseClient, 'user-1');

    expect(result).toEqual({
      id: 'user-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      role: 'parent',
      avatar_url: null,
    });
  });

  it('returns null when no profile is found', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: null },
    });

    const result = await getProfileById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'connection lost' } },
    });

    await expect(
      getProfileById(client as unknown as TypedSupabaseClient, 'user-1')
    ).rejects.toThrow('Failed to fetch profile: connection lost');
  });
});
