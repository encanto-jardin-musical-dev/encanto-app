import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateParent } from './update-parent';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const reconcileLinks = vi.fn();
vi.mock('@/queries/shared/reconcile-links', () => ({
  reconcileLinks: (...args: unknown[]) => reconcileLinks(...args),
}));

const baseParams = {
  id: 'parent-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc' as const,
  document_number: '123',
  role: 'parent' as const,
  children: [{ child_id: 'child-1', relationship: 'mother' as const }],
};

describe('updateParent', () => {
  afterEach(() => {
    reconcileLinks.mockClear();
  });

  it('updates the profile row scoped to the parent role and reconciles children with mutableFields', async () => {
    const client = createSupabaseClientMock({ profiles: { data: null, error: null } });

    await updateParent(client as unknown as TypedSupabaseClient, baseParams);

    const builder = client.from.mock.results[0].value;
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'id', 'parent-1');
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'role', 'parent');
    expect(reconcileLinks).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        table: 'child_guardians',
        parentId: 'parent-1',
        mutableFields: ['relationship'],
      })
    );
  });

  it('throws when the profile update errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'boom' } },
    });

    await expect(updateParent(client as unknown as TypedSupabaseClient, baseParams)).rejects.toThrow(
      'Failed to update parent: boom'
    );
    expect(reconcileLinks).not.toHaveBeenCalled();
  });
});
