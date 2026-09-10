import { describe, expect, it } from 'vitest';
import { getUserChildren } from './get-user-children';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getUserChildren', () => {
  it('resolves with the guardian relationships and nested children', async () => {
    const client = createSupabaseClientMock({
      child_guardians: {
        data: [{ relationship: 'mother', children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' } }],
        error: null,
      },
    });

    const result = await getUserChildren(client as unknown as TypedSupabaseClient, 'user-1', 'group-1');

    expect(result).toEqual({
      data: [{ relationship: 'mother', children: { id: 'child-1', first_name: 'Ada', last_name: 'Lovelace' } }],
      error: null,
    });
  });

  it('filters by guardian_id only when userID is provided', async () => {
    const client = createSupabaseClientMock({
      child_guardians: { data: [], error: null },
    });

    await getUserChildren(client as unknown as TypedSupabaseClient, 'user-1');

    const builder = client.from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith('guardian_id', 'user-1');
    expect(builder.eq).not.toHaveBeenCalledWith('children.child_groups.group_id', expect.anything());
  });

  it('also filters by children.child_groups.group_id when groupID is provided', async () => {
    const client = createSupabaseClientMock({
      child_guardians: { data: [], error: null },
    });

    await getUserChildren(client as unknown as TypedSupabaseClient, 'user-1', 'group-1');

    const builder = client.from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith('guardian_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('children.child_groups.group_id', 'group-1');
  });

  it('passes through a query error without throwing', async () => {
    const client = createSupabaseClientMock({
      child_guardians: { data: null, error: { message: 'connection lost' } },
    });

    const result = await getUserChildren(client as unknown as TypedSupabaseClient, 'user-1');

    expect(result).toEqual({ data: null, error: { message: 'connection lost' } });
  });
});
