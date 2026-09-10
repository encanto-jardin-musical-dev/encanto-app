import { describe, expect, it } from 'vitest';
import { deleteGroup } from './delete-group';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('deleteGroup', () => {
  it('deletes the group by id', async () => {
    const client = createSupabaseClientMock({ groups: { data: null, error: null } });

    await deleteGroup(client as unknown as TypedSupabaseClient, 'group-1');

    const builder = client.from.mock.results[0].value;
    expect(client.from).toHaveBeenCalledWith('groups');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'group-1');
  });

  it('throws when the delete errors', async () => {
    const client = createSupabaseClientMock({
      groups: { data: null, error: { message: 'fk violation' } },
    });

    await expect(deleteGroup(client as unknown as TypedSupabaseClient, 'group-1')).rejects.toThrow(
      'Failed to delete group: fk violation'
    );
  });
});
