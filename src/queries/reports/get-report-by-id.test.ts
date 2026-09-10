import { describe, expect, it } from 'vitest';
import { getReportById } from './get-report-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getReportById', () => {
  it('returns the report with group name and author profile', async () => {
    const client = createSupabaseClientMock({
      daily_reports: {
        data: {
          id: 'report-1',
          title: 'Nap time',
          groups: { name: 'Group A' },
          profiles: { first_name: 'Ada', last_name: 'Lovelace' },
        },
        error: null,
      },
    });

    const result = await getReportById(client as unknown as TypedSupabaseClient, 'report-1');

    expect(result).toEqual({
      id: 'report-1',
      title: 'Nap time',
      groups: { name: 'Group A' },
      profiles: { first_name: 'Ada', last_name: 'Lovelace' },
    });
  });

  it('returns null when no report is found', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: null },
    });

    const result = await getReportById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getReportById(client as unknown as TypedSupabaseClient, 'report-1')
    ).rejects.toThrow('Failed to fetch report: boom');
  });
});
