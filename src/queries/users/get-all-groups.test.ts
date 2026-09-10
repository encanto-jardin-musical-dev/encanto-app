import { describe, expect, it } from 'vitest';
import { getAllGroups } from './get-all-groups';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getAllGroups', () => {
  it('resolves with the groups returned by the query', async () => {
    const client = createSupabaseClientMock({
      groups: { data: [{ id: 'group-1', name: 'Group A' }], error: null },
    });

    const result = await getAllGroups(client as unknown as TypedSupabaseClient);

    expect(result).toEqual({ data: [{ id: 'group-1', name: 'Group A' }], error: null });
  });

  it('passes through a query error without throwing', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'connection lost' } },
    });

    const result = await getAllGroups(client as unknown as TypedSupabaseClient);

    expect(result).toEqual({ data: null, error: { message: 'connection lost' } });
  });
});
