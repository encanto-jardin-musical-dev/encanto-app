import { describe, expect, it } from 'vitest';
import { getStaffReports } from './get-staff-reports';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getStaffReports', () => {
  it("returns reports across all groups when no teacherId is given (admin)", async () => {
    const client = createSupabaseClientMock({
      daily_reports: {
        data: [{ id: 'report-1', groups: { name: 'Group A' }, children: null }],
        error: null,
      },
    });

    const result = await getStaffReports(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([{ id: 'report-1', groups: { name: 'Group A' }, children: null }]);
  });

  it('scopes to the given teacher\'s groups', async () => {
    const client = createSupabaseClientMock({
      daily_reports: {
        data: [{ id: 'report-1', groups: { name: 'Group A' }, children: null }],
        error: null,
      },
    });

    const result = await getStaffReports(client as unknown as TypedSupabaseClient, {
      teacherId: 'teacher-1',
    });

    expect(result).toEqual([{ id: 'report-1', groups: { name: 'Group A' }, children: null }]);
  });

  it('returns an empty array when there is no data', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: null },
    });

    const result = await getStaffReports(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      daily_reports: { data: null, error: { message: 'boom' } },
    });

    await expect(getStaffReports(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch staff reports: boom'
    );
  });
});
