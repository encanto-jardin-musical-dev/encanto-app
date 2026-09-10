import { describe, expect, it } from 'vitest';
import { deleteReport } from './delete-report';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('deleteReport', () => {
  it('deletes the report by id', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: null },
    });

    await deleteReport(client as unknown as TypedSupabaseClient, 'report-1');

    expect(client.from).toHaveBeenCalledWith('daily_reports');
  });

  it('throws when the delete errors', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: { message: 'not found' } },
    });

    await expect(
      deleteReport(client as unknown as TypedSupabaseClient, 'report-1')
    ).rejects.toThrow('Failed to delete report: not found');
  });
});
