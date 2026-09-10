import { describe, expect, it } from 'vitest';
import { getUserProfiles } from './get-user-profiles';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getUserProfiles', () => {
  it('resolves with the matching profiles', async () => {
    const client = createSupabaseClientMock({
      profiles: {
        data: [{ id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', role: 'parent', avatar_url: null }],
        error: null,
      },
    });

    const result = await getUserProfiles(client as unknown as TypedSupabaseClient, ['user-1']);

    expect(result).toEqual({
      data: [{ id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', role: 'parent', avatar_url: null }],
      error: null,
    });
  });

  it('filters by the given ids', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: [], error: null },
    });

    await getUserProfiles(client as unknown as TypedSupabaseClient, ['user-1', 'user-2']);

    const builder = client.from.mock.results[0].value;
    expect(builder.in).toHaveBeenCalledWith('id', ['user-1', 'user-2']);
  });

  it('passes through a query error without throwing', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'connection lost' } },
    });

    const result = await getUserProfiles(client as unknown as TypedSupabaseClient, ['user-1']);

    expect(result).toEqual({ data: null, error: { message: 'connection lost' } });
  });
});
