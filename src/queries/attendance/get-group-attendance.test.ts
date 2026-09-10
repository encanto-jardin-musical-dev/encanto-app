import { describe, expect, it } from 'vitest';
import { getGroupAttendance } from './get-group-attendance';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupAttendance', () => {
  it('merges group children with today\'s attendance rows', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            child_groups: [
              {
                children: {
                  id: 'child-1',
                  first_name: 'Ada',
                  last_name: 'Lovelace',
                  avatar_url: null,
                },
              },
            ],
          },
        ],
        error: null,
      },
      attendance: {
        data: [{ child_id: 'child-1', check_in: '2024-01-01T08:00:00Z', check_out: null }],
        error: null,
      },
    });

    const result = await getGroupAttendance(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual([
      {
        id: 'child-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
        avatar_url: null,
        check_in: '2024-01-01T08:00:00Z',
        check_out: null,
      },
    ]);
  });

  it('returns null when the group is not found', async () => {
    const client = createSupabaseClientMock({
      groups: { data: [], error: null },
    });

    const result = await getGroupAttendance(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('derives absent (null) attendance for children with no row today', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            child_groups: [
              {
                children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null },
              },
            ],
          },
        ],
        error: null,
      },
      attendance: { data: [], error: null },
    });

    const result = await getGroupAttendance(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toEqual([
      {
        id: 'child-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
        avatar_url: null,
        check_in: null,
        check_out: null,
      },
    ]);
  });

  it('throws when the group query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getGroupAttendance(client as unknown as TypedSupabaseClient, 'group-1')
    ).rejects.toThrow('Failed to fetch group attendance: boom');
  });

  it('throws when the attendance query errors', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            child_groups: [
              {
                children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null },
              },
            ],
          },
        ],
        error: null,
      },
      attendance: { data: null, error: { message: 'timeout' } },
    });

    await expect(
      getGroupAttendance(client as unknown as TypedSupabaseClient, 'group-1')
    ).rejects.toThrow("Failed to fetch today's attendance: timeout");
  });
});
