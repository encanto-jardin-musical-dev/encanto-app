import { describe, expect, it } from 'vitest';
import { getAttendedChildren } from './get-attended-children';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getAttendedChildren', () => {
  it('returns children present or late on the given date', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            child_groups: [
              { children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' } },
              { children: { id: 'child-2', first_name: 'Grace', last_name: 'Hopper' } },
            ],
          },
        ],
        error: null,
      },
      attendance: {
        data: [{ child_id: 'child-1', status: 'present' }],
        error: null,
      },
    });

    const result = await getAttendedChildren(
      client as unknown as TypedSupabaseClient,
      'group-1',
      '2024-01-01'
    );

    expect(result).toEqual([{ id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' }]);
  });

  it('always includes includeChildId even without a matching attendance record', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            child_groups: [
              { children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' } },
              { children: { id: 'child-2', first_name: 'Grace', last_name: 'Hopper' } },
            ],
          },
        ],
        error: null,
      },
      attendance: { data: [], error: null },
    });

    const result = await getAttendedChildren(
      client as unknown as TypedSupabaseClient,
      'group-1',
      '2024-01-01',
      'child-2'
    );

    expect(result).toEqual([{ id: 'child-2', first_name: 'Grace', last_name: 'Hopper' }]);
  });

  it('returns an empty array when the group has no row', async () => {
    const client = createSupabaseClientMock({
      groups: { data: [], error: null },
    });

    const result = await getAttendedChildren(
      client as unknown as TypedSupabaseClient,
      'missing-group',
      '2024-01-01'
    );

    expect(result).toEqual([]);
  });

  it('throws when fetching the group fails', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getAttendedChildren(client as unknown as TypedSupabaseClient, 'group-1', '2024-01-01')
    ).rejects.toThrow('Failed to fetch group children: boom');
  });

  it('throws when fetching attendance fails', async () => {
    const client = createSupabaseClientMock({
      groups: {
        data: [
          {
            id: 'group-1',
            child_groups: [{ children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' } }],
          },
        ],
        error: null,
      },
      attendance: { data: null, error: { message: 'boom' } },
    });

    await expect(
      getAttendedChildren(client as unknown as TypedSupabaseClient, 'group-1', '2024-01-01')
    ).rejects.toThrow('Failed to fetch attendance: boom');
  });
});
