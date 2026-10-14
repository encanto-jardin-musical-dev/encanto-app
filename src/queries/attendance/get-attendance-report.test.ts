import { describe, expect, it } from 'vitest';
import { getAttendanceReport } from './get-attendance-report';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const params = { childId: 'child-1', from: '2026-10-01', to: '2026-10-13' };

describe('getAttendanceReport', () => {
  it('calls the RPC with the mapped params and returns rows', async () => {
    const rows = [
      { attendance_id: 'a1', attendance_date: '2026-10-10', check_in: '2026-10-10T12:00:00Z', check_out: null },
    ];
    const client = createSupabaseClientMock();
    client.rpc.mockResolvedValueOnce({ data: rows, error: null });

    const result = await getAttendanceReport(client as unknown as TypedSupabaseClient, params);

    expect(client.rpc).toHaveBeenCalledWith('get_attendance_report', {
      p_child_id: 'child-1',
      p_from: '2026-10-01',
      p_to: '2026-10-13',
    });
    expect(result).toEqual(rows);
  });

  it('returns an empty array when the RPC returns null data', async () => {
    const client = createSupabaseClientMock();

    const result = await getAttendanceReport(client as unknown as TypedSupabaseClient, params);

    expect(result).toEqual([]);
  });

  it('throws when the RPC errors', async () => {
    const client = createSupabaseClientMock();
    client.rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    await expect(
      getAttendanceReport(client as unknown as TypedSupabaseClient, params)
    ).rejects.toThrow('Failed to fetch attendance report: boom');
  });
});
