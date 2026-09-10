import { describe, expect, it } from 'vitest';
import { updateChild, type UpdateChildParams } from './update-child';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const baseParams: UpdateChildParams = {
  id: 'child-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc',
  document_number: '123',
  gender: 'female',
  birth_date: '2019-01-01',
  address: 'Main St',
  groupIds: ['group-1'],
  guardians: [{ guardian_id: 'guardian-1', relationship: 'mother' }],
};

describe('updateChild', () => {
  it('updates the child and reconciles group/guardian links', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: null },
      child_groups: { data: [], error: null },
      child_guardians: { data: [], error: null },
    });

    await updateChild(client as unknown as TypedSupabaseClient, baseParams);

    expect(client.from).toHaveBeenCalledWith('children');
    expect(client.from).toHaveBeenCalledWith('child_groups');
    expect(client.from).toHaveBeenCalledWith('child_guardians');
  });

  it('throws when the update errors', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: { message: 'not found' } },
    });

    await expect(updateChild(client as unknown as TypedSupabaseClient, baseParams)).rejects.toThrow(
      'Failed to update child: not found'
    );
  });
});
