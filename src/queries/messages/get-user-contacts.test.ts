import { describe, expect, it } from 'vitest';
import { getUserContacts } from './get-user-contacts';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('getUserContacts', () => {
  it('excludes the current user and resolves all contacts when no role filter is given', async () => {
    const contacts = [{ id: 'user-2', first_name: 'Ada', last_name: 'Lovelace' }];
    const client = createSupabaseClientMock({ profiles: { data: contacts, error: null } });

    const result = await getUserContacts(client as unknown as TypedSupabaseClient, 'user-1');

    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(result).toEqual({ data: contacts, error: null });
  });

  it('applies a role filter when given', async () => {
    const contacts = [{ id: 'user-3', role: 'teacher' }];
    const client = createSupabaseClientMock({ profiles: { data: contacts, error: null } });

    const result = await getUserContacts(client as unknown as TypedSupabaseClient, 'user-1', 'teacher');

    expect(result).toEqual({ data: contacts, error: null });
  });

  it('passes through a query error unchanged', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    const result = await getUserContacts(client as unknown as TypedSupabaseClient, 'user-1');

    expect(result).toEqual({ data: null, error: { message: 'boom' } });
  });
});
