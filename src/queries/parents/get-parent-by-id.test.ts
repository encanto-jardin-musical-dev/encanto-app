import { describe, expect, it } from 'vitest';
import { getParentById } from './get-parent-by-id';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getParentById', () => {
  it('maps a parent row with nested children and relationships', async () => {
    const client = createSupabaseClientMock({
      profiles: {
        data: [
          {
            id: 'parent-1',
            first_name: 'Grace',
            last_name: 'Hopper',
            document_type: 'cc',
            document_number: '123',
            role: 'parent',
            phone: null,
            avatar_url: null,
            child_guardians: [
              {
                relationship: 'mother',
                children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null },
              },
            ],
          },
        ],
        error: null,
      },
    });

    const result = await getParentById(client as unknown as TypedSupabaseClient, 'parent-1');

    expect(result).toEqual({
      id: 'parent-1',
      first_name: 'Grace',
      last_name: 'Hopper',
      document_type: 'cc',
      document_number: '123',
      role: 'parent',
      phone: null,
      avatar_url: null,
      children: [
        { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null, relationship: 'mother' },
      ],
    });
  });

  it('returns null when no matching parent row is found', async () => {
    const client = createSupabaseClientMock({ profiles: { data: [], error: null } });

    const result = await getParentById(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(getParentById(client as unknown as TypedSupabaseClient, 'parent-1')).rejects.toThrow(
      'Failed to fetch parent: boom'
    );
  });
});
