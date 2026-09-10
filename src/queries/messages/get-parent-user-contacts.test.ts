import { describe, expect, it, vi } from 'vitest';
import { getParentUserContacts } from './get-parent-user-contacts';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getParentUserContacts', () => {
  it('calls the get_profiles_by_guardian rpc with the given child id', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ id: 'contact-1' }], error: null });
    const client = { rpc } as unknown as TypedSupabaseClient;

    const result = await getParentUserContacts(client, 'child-1');

    expect(rpc).toHaveBeenCalledWith('get_profiles_by_guardian', { p_child_id: 'child-1' });
    expect(result).toEqual({ data: [{ id: 'contact-1' }], error: null });
  });

  it('passes undefined when no child id is given', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const client = { rpc } as unknown as TypedSupabaseClient;

    await getParentUserContacts(client);

    expect(rpc).toHaveBeenCalledWith('get_profiles_by_guardian', { p_child_id: undefined });
  });

  it('passes through an rpc error unchanged', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const client = { rpc } as unknown as TypedSupabaseClient;

    const result = await getParentUserContacts(client, 'child-1');

    expect(result).toEqual({ data: null, error: { message: 'boom' } });
  });
});
