import { describe, expect, it } from 'vitest';
import { createReport } from './create-report';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('createReport', () => {
  it('inserts a report with defaults applied for optional fields', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: null },
    });

    await createReport(client as unknown as TypedSupabaseClient, {
      title: 'Nap time',
      groupId: 'group-1',
      teacherId: 'teacher-1',
    });

    expect(client.from).toHaveBeenCalledWith('daily_reports');
  });

  it('throws when the insert errors', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: { message: 'constraint violation' } },
    });

    await expect(
      createReport(client as unknown as TypedSupabaseClient, {
        title: 'Nap time',
        groupId: 'group-1',
        teacherId: 'teacher-1',
      })
    ).rejects.toThrow('Failed to create report: constraint violation');
  });
});
