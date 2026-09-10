import { describe, expect, it } from 'vitest';
import { deleteChild } from './delete-child';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('deleteChild', () => {
  it('deletes the child by id', async () => {
    const client = createSupabaseClientMock({ children: { data: null, error: null } });

    await deleteChild(client as unknown as TypedSupabaseClient, 'child-1');

    const builder = client.from.mock.results[0].value;
    expect(client.from).toHaveBeenCalledWith('children');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'child-1');
  });

  it('throws when the delete errors', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: { message: 'fk violation' } },
    });

    await expect(deleteChild(client as unknown as TypedSupabaseClient, 'child-1')).rejects.toThrow(
      'Failed to delete child: fk violation'
    );
  });
});
