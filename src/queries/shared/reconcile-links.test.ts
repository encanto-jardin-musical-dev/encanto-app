import { describe, expect, it, vi } from 'vitest';
import { reconcileLinks } from './reconcile-links';
import { createQueryBuilderMock, type MockResult } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

type LinkEntry = { child_id: string; relationship?: string };

function clientWithFromSequence(results: MockResult[]) {
  const from = vi.fn();
  for (const result of results) {
    from.mockReturnValueOnce(createQueryBuilderMock(result));
  }
  return { from } as unknown as TypedSupabaseClient;
}

const baseCfg = {
  table: 'child_guardians' as const,
  parentColumn: 'guardian_id',
  childColumn: 'child_id',
  parentId: 'parent-1',
  getKey: (e: LinkEntry) => e.child_id,
  buildRow: (e: LinkEntry) => ({
    guardian_id: 'parent-1',
    child_id: e.child_id,
    relationship: e.relationship,
  }),
};

describe('reconcileLinks', () => {
  it('inserts newly desired links and deletes links no longer desired', async () => {
    const client = clientWithFromSequence([
      { data: [{ child_id: 'k1' }, { child_id: 'k2' }], error: null }, // fetch existing
      { data: null, error: null }, // insert toAdd
      { data: null, error: null }, // delete toRemove
    ]);

    await reconcileLinks(client, {
      ...baseCfg,
      desired: [{ child_id: 'k2' }, { child_id: 'k3' }],
    });

    const insertBuilder = (client.from as ReturnType<typeof vi.fn>).mock.results[1].value;
    const deleteBuilder = (client.from as ReturnType<typeof vi.fn>).mock.results[2].value;

    expect(insertBuilder.insert).toHaveBeenCalledWith([
      { guardian_id: 'parent-1', child_id: 'k3', relationship: undefined },
    ]);
    expect(deleteBuilder.in).toHaveBeenCalledWith('child_id', ['k1']);
  });

  it('re-syncs existing links whose mutable fields changed', async () => {
    const client = clientWithFromSequence([
      { data: [{ child_id: 'k1', relationship: 'mother' }], error: null }, // fetch existing
      { data: null, error: null }, // delete stale (replace)
      { data: null, error: null }, // re-insert (replace)
    ]);

    await reconcileLinks(client, {
      ...baseCfg,
      desired: [{ child_id: 'k1', relationship: 'father' }],
      mutableFields: ['relationship'],
    });

    const deleteBuilder = (client.from as ReturnType<typeof vi.fn>).mock.results[1].value;
    const insertBuilder = (client.from as ReturnType<typeof vi.fn>).mock.results[2].value;

    expect(deleteBuilder.in).toHaveBeenCalledWith('child_id', ['k1']);
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      { guardian_id: 'parent-1', child_id: 'k1', relationship: 'father' },
    ]);
  });

  it('does not touch links whose mutable fields are unchanged', async () => {
    const client = clientWithFromSequence([
      { data: [{ child_id: 'k1', relationship: 'mother' }], error: null },
    ]);

    await reconcileLinks(client, {
      ...baseCfg,
      desired: [{ child_id: 'k1', relationship: 'mother' }],
      mutableFields: ['relationship'],
    });

    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it('throws when fetching existing links fails', async () => {
    const client = clientWithFromSequence([{ data: null, error: { message: 'boom' } }]);

    await expect(
      reconcileLinks(client, { ...baseCfg, desired: [{ child_id: 'k1' }] })
    ).rejects.toThrow('reconcileLinks: failed to fetch from child_guardians: boom');
  });

  it('throws when inserting new links fails', async () => {
    const client = clientWithFromSequence([
      { data: [], error: null },
      { data: null, error: { message: 'boom' } },
    ]);

    await expect(
      reconcileLinks(client, { ...baseCfg, desired: [{ child_id: 'k1' }] })
    ).rejects.toThrow('reconcileLinks: failed to insert into child_guardians: boom');
  });

  it('throws when deleting stale links fails', async () => {
    const client = clientWithFromSequence([
      { data: [{ child_id: 'k1' }], error: null },
      { data: null, error: { message: 'boom' } },
    ]);

    await expect(reconcileLinks(client, { ...baseCfg, desired: [] })).rejects.toThrow(
      'reconcileLinks: failed to delete from child_guardians: boom'
    );
  });
});
