import { describe, expect, it } from 'vitest';
import { getGroupReports } from './get-group-reports';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupReports', () => {
  it('returns reports for the group joined with author and child names', async () => {
    const client = createSupabaseClientMock({
      daily_reports: {
        data: [
          {
            id: 'report-1',
            title: 'Nap time',
            group_id: 'group-1',
            child_id: null,
            profiles: { first_name: 'Ada', last_name: 'Lovelace' },
            children: null,
          },
        ],
        error: null,
      },
    });

    const result = await getGroupReports(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual([
      {
        id: 'report-1',
        title: 'Nap time',
        group_id: 'group-1',
        child_id: null,
        profiles: { first_name: 'Ada', last_name: 'Lovelace' },
        children: null,
      },
    ]);
  });

  it('returns an empty array when there is no data', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: null },
    });

    const result = await getGroupReports(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getGroupReports(client as unknown as TypedSupabaseClient, 'group-1')
    ).rejects.toThrow('Failed to fetch group reports: boom');
  });
});
