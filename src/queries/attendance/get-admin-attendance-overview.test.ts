import { describe, expect, it } from 'vitest';
import { getAdminAttendanceOverview } from './get-admin-attendance-overview';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getAdminAttendanceOverview', () => {
  it('returns groups with only currently-present children', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            name: 'Group A',
            child_groups: [
              {
                children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null },
              },
              {
                children: { id: 'child-2', first_name: 'Grace', last_name: 'Hopper', avatar_url: null },
              },
            ],
          },
          {
            id: 'group-2',
            name: 'Group B',
            child_groups: [
              {
                children: { id: 'child-3', first_name: 'Alan', last_name: 'Turing', avatar_url: null },
              },
            ],
          },
        ],
        error: null,
      },
      attendance: {
        data: [
          // child-1 currently present (checked in, no checkout)
          { child_id: 'child-1', check_in: '2024-01-01T08:00:00Z', check_out: null },
          // child-2 already checked out — not present
          { child_id: 'child-2', check_in: '2024-01-01T08:00:00Z', check_out: '2024-01-01T09:00:00Z' },
          // child-3 has no attendance row at all — not present
        ],
        error: null,
      },
    });

    const result = await getAdminAttendanceOverview(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([
      {
        groupId: 'group-1',
        groupName: 'Group A',
        children: [
          {
            id: 'child-1',
            first_name: 'Ada',
            last_name: 'Lovelace',
            avatar_url: null,
            check_in: '2024-01-01T08:00:00Z',
            check_out: null,
          },
        ],
      },
    ]);
  });

  it('returns an empty array when there are no groups', async () => {
    const client = createSupabaseClientMock({
      groups: { data: [], error: null },
    });

    const result = await getAdminAttendanceOverview(client as unknown as TypedSupabaseClient);

    expect(result).toEqual([]);
  });

  it('throws when the groups query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(getAdminAttendanceOverview(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch groups for attendance overview: boom'
    );
  });

  it('throws when the attendance query errors', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            name: 'Group A',
            child_groups: [
              { children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null } },
            ],
          },
        ],
        error: null,
      },
      attendance: { data: null, error: { message: 'timeout' } },
    });

    await expect(getAdminAttendanceOverview(client as unknown as TypedSupabaseClient)).rejects.toThrow(
      "Failed to fetch today's attendance: timeout"
    );
  });
});
