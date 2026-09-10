import { describe, expect, it } from 'vitest';
import { createGroup } from './create-group';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('createGroup', () => {
  it('creates the group and returns its id', async () => {
    const client = createSupabaseClientMock({
      groups: { data: { id: 'group-1' }, error: null },
    });

    const result = await createGroup(client as unknown as TypedSupabaseClient, { name: 'Group A' });

    expect(result).toBe('group-1');
  });

  it('reconciles teacher links when provided', async () => {
    const client = createSupabaseClientMock({
      groups: { data: { id: 'group-1' }, error: null },
      group_teachers: { data: [], error: null },
    });

    await createGroup(client as unknown as TypedSupabaseClient, {
      name: 'Group A',
      teacherIds: ['teacher-1'],
    });

    expect(client.from).toHaveBeenCalledWith('group_teachers');
  });

  it('throws when the insert errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'duplicate name' } },
    });

    await expect(
      createGroup(client as unknown as TypedSupabaseClient, { name: 'Group A' })
    ).rejects.toThrow('Failed to create group: duplicate name');
  });
});
