import { describe, expect, it } from 'vitest';
import { updateReport } from './update-report';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('updateReport', () => {
  it('updates the report by id', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: null },
    });

    await updateReport(client as unknown as TypedSupabaseClient, {
      reportId: 'report-1',
      title: 'Updated title',
      groupId: 'group-1',
    });

    expect(client.from).toHaveBeenCalledWith('daily_reports');
  });

  it('throws when the update errors', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: { message: 'boom' } },
    });

    await expect(
      updateReport(client as unknown as TypedSupabaseClient, {
        reportId: 'report-1',
        title: 'Updated title',
        groupId: 'group-1',
      })
    ).rejects.toThrow('Failed to update report: boom');
  });
});
