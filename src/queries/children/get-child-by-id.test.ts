import { describe, expect, it } from 'vitest';
import { getChildById } from './get-child-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getChildById', () => {
  it('maps a child row with nested groups and guardians', async () => {
    const client = createSupabaseClientMock({
      children: {
        data: [
          {
            id: 'child-1',
            first_name: 'Ada',
            last_name: 'Lovelace',
            document_type: 'cc',
            document_number: '123',
            gender: 'female',
            birth_date: '2019-01-01',
            address: null,
            avatar_url: null,
            child_groups: [{ groups: { id: 'group-1', name: 'Group A', image_url: null } }],
            child_guardians: [
              {
                relationship: 'mother',
                guardian_id: 'guardian-1',
                profiles: { id: 'guardian-1', first_name: 'Grace', last_name: 'Hopper' },
              },
            ],
          },
        ],
        error: null,
      },
    });

    const result = await getChildById(client as unknown as TypedSupabaseClient, 'child-1');

    expect(result).toEqual({
      id: 'child-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      document_type: 'cc',
      document_number: '123',
      gender: 'female',
      birth_date: '2019-01-01',
      address: null,
      avatar_url: null,
      groups: [{ id: 'group-1', name: 'Group A', image_url: null }],
      guardians: [{ id: 'guardian-1', first_name: 'Grace', last_name: 'Hopper', relationship: 'mother' }],
    });
  });

  it('returns null when no row is found', async () => {
    const client = createSupabaseClientMock({
      children: { data: [], error: null },
    });

    const result = await getChildById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: { message: 'connection lost' } },
    });

    await expect(getChildById(client as unknown as TypedSupabaseClient, 'child-1')).rejects.toThrow(
      'Failed to fetch child: connection lost'
    );
  });
});
