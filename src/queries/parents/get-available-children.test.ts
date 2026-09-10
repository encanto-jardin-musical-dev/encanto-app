import { describe, expect, it } from 'vitest';
import { getAvailableChildren } from './get-available-children';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getAvailableChildren', () => {
  it('maps children ordered alphabetically, defaulting avatar_url to null', async () => {
    const rows = [{ id: 'c1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null }];
    const client = createSupabaseClientMock({ children: { data: rows, error: null } });

    const result = await getAvailableChildren(client as unknown as TypedSupabaseClient);

    expect(result).toEqual(rows);
  });

  it('returns an empty array when there are no children', async () => {
    const client = createSupabaseClientMock({ children: { data: null, error: null } });

    const result = await getAvailableChildren(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: { message: 'boom' } },
    });

    await expect(getAvailableChildren(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch available children: boom'
    );
  });
});
