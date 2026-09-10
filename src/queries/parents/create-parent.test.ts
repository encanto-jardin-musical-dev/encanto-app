import { describe, expect, it, vi } from 'vitest';
import { createParent } from './create-parent';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const reconcileLinks = vi.fn();
vi.mock('@/queries/shared/reconcile-links', () => ({
  reconcileLinks: (...args: unknown[]) => reconcileLinks(...args),
}));

function clientWithInvoke(result: { data: unknown; error: unknown }) {
  return { functions: { invoke: vi.fn().mockResolvedValue(result) } } as unknown as TypedSupabaseClient;
}

const baseParams = {
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  document_type: 'cc' as const,
  document_number: '123',
  role: 'parent' as const,
};

describe('createParent', () => {
  it('invokes admin-create-user and returns the new profile id', async () => {
    const client = clientWithInvoke({
      data: { profile: { id: 'parent-1' } },
      error: null,
    });

    const id = await createParent(client, baseParams);

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-create-user', {
      body: {
        email: baseParams.email,
        role: 'parent',
        first_name: baseParams.first_name,
        last_name: baseParams.last_name,
        document_type: baseParams.document_type,
        document_number: baseParams.document_number,
        phone: null,
      },
    });
    expect(id).toBe('parent-1');
    expect(reconcileLinks).not.toHaveBeenCalled();
  });

  it('reconciles child_guardians links when children are given', async () => {
    const client = clientWithInvoke({ data: { profile: { id: 'parent-1' } }, error: null });

    await createParent(client, { ...baseParams, children: [{ child_id: 'child-1', relationship: 'mother' }] });

    expect(reconcileLinks).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ table: 'child_guardians', parentId: 'parent-1' })
    );
  });

  it('throws a generic error when the edge function fails without a JSON body', async () => {
    const client = clientWithInvoke({ data: null, error: { message: 'boom' } });

    await expect(createParent(client, baseParams)).rejects.toThrow('Failed to create parent: boom');
  });

  it('surfaces a specific error code parsed from the function error body', async () => {
    const error = {
      message: 'boom',
      context: { json: vi.fn().mockResolvedValue({ error: 'EMAIL_ALREADY_REGISTERED' }) },
    };
    const client = clientWithInvoke({ data: null, error });

    await expect(createParent(client, baseParams)).rejects.toThrow('EMAIL_ALREADY_REGISTERED');
  });

  it('throws when no profile is returned', async () => {
    const client = clientWithInvoke({ data: { profile: undefined }, error: null });

    await expect(createParent(client, baseParams)).rejects.toThrow(
      'Failed to create parent: no profile returned'
    );
  });
});
