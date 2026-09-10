import { describe, expect, it } from 'vitest';
import { createChild, type CreateChildParams } from './create-child';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const baseParams: CreateChildParams = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc',
  document_number: '123',
  gender: 'female',
  birth_date: '2019-01-01',
  address: 'Main St',
};

describe('createChild', () => {
  it('creates the child and returns its id', async () => {
    const client = createSupabaseClientMock({
      children: { data: { id: 'child-1' }, error: null },
    });

    const result = await createChild(client as unknown as TypedSupabaseClient, baseParams);

    expect(result).toBe('child-1');
  });

  it('reconciles group and guardian links when provided', async () => {
    const client = createSupabaseClientMock({
      children: { data: { id: 'child-1' }, error: null },
      child_groups: { data: [], error: null },
      child_guardians: { data: [], error: null },
    });

    await createChild(client as unknown as TypedSupabaseClient, {
      ...baseParams,
      groupIds: ['group-1'],
      guardians: [{ guardian_id: 'guardian-1', relationship: 'mother' }],
    });

    expect(client.from).toHaveBeenCalledWith('child_groups');
    expect(client.from).toHaveBeenCalledWith('child_guardians');
  });

  it('throws when the insert errors', async () => {
    const client = createSupabaseClientMock({
      children: { data: null, error: { message: 'duplicate document_number' } },
    });

    await expect(createChild(client as unknown as TypedSupabaseClient, baseParams)).rejects.toThrow(
      'Failed to create child: duplicate document_number'
    );
  });
});
