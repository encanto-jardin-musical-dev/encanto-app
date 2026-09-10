import { describe, expect, it } from 'vitest';
import { getGroupName } from './get-group-name';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getGroupName', () => {
  it('returns the group name', async () => {
    const client = createSupabaseClientMock({
      groups: { data: { name: 'Group A' }, error: null },
    });

    const result = await getGroupName(client as unknown as TypedSupabaseClient, 'group-1');

    expect(result).toBe('Group A');
  });

  it('returns null when the group does not exist', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: null },
    });

    const result = await getGroupName(client as unknown as TypedSupabaseClient, 'missing');

    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'boom' } },
    });

    await expect(getGroupName(client as unknown as TypedSupabaseClient, 'group-1')).rejects.toThrow(
      'Failed to fetch group name: boom'
    );
  });
});
