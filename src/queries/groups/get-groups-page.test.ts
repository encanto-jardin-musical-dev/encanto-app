import { describe, expect, it } from 'vitest';
import { getGroupsPage } from './get-groups-page';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupsPage', () => {
  it('returns mapped rows', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [{ id: 'group-1', name: 'Group A', image_url: null }],
        error: null,
      },
    });

    const result = await getGroupsPage(client as unknown as TypedSupabaseClient, {
      offset: 0,
      pageSize: 20,
    });

    expect(result).toEqual([{ id: 'group-1', name: 'Group A', image_url: null }]);
  });

  it('applies a search filter when provided', async () => {
    const client = createSupabaseClientMock({ groups: { data: [], error: null } });

    await getGroupsPage(client as unknown as TypedSupabaseClient, {
      search: 'group a',
      offset: 0,
      pageSize: 20,
    });

    const builder = client.from.mock.results[0].value;
    expect(builder.ilike).toHaveBeenCalledWith('name', '%group a%');
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getGroupsPage(client as unknown as TypedSupabaseClient, { offset: 0, pageSize: 20 })
    ).rejects.toThrow('Failed to fetch groups page: boom');
  });
});
