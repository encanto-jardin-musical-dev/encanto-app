import { describe, expect, it } from 'vitest';
import {
  ALL_SELECTION_KEY,
  getSelectionFromStoredValue,
  reconcileGroupContextSelection,
} from './index';

const GROUP_X = 'group-x';
const GROUP_Y = 'group-y';
const OPTIONS = [GROUP_X, GROUP_Y];

describe('reconcileGroupContextSelection', () => {
  it('keeps a selection that is still offered', () => {
    expect(reconcileGroupContextSelection(new Set([GROUP_Y]), OPTIONS)).toEqual({
      kind: 'keep',
    });
  });

  it('falls back to the first option when the stored key is no longer offered', () => {
    // e.g. the teacher was unassigned from the group persisted in localStorage
    const outcome = reconcileGroupContextSelection(new Set(['group-removed']), [
      GROUP_X,
      GROUP_Y,
    ]);

    expect(outcome).toEqual({ kind: 'select', selection: new Set([GROUP_X]) });
  });

  it('reconciles the "all" fallback because it is not a real choice', () => {
    expect(reconcileGroupContextSelection(ALL_SELECTION_KEY, OPTIONS)).toEqual({
      kind: 'select',
      selection: new Set([GROUP_X]),
    });
  });

  it('reconciles a persisted all-marker after it round-trips through storage', () => {
    // The marker is what localStorage holds; `getSelectionFromStoredValue` is
    // what turns it into the `Selection` the reconcile actually receives.
    const fromStorage = getSelectionFromStoredValue('__ALL_ITEMS_SELECTED__');

    expect(fromStorage).toBe(ALL_SELECTION_KEY);
    expect(reconcileGroupContextSelection(fromStorage, OPTIONS)).toEqual({
      kind: 'select',
      selection: new Set([GROUP_X]),
    });
  });

  it('reconciles an empty selection set', () => {
    expect(reconcileGroupContextSelection(new Set<string>(), OPTIONS)).toEqual({
      kind: 'select',
      selection: new Set([GROUP_X]),
    });
  });

  it('selects the first option when nothing was selected yet', () => {
    expect(reconcileGroupContextSelection(undefined, OPTIONS)).toEqual({
      kind: 'select',
      selection: new Set([GROUP_X]),
    });
  });

  it('clears the selection when there are genuinely no options', () => {
    expect(reconcileGroupContextSelection(new Set([GROUP_X]), [])).toEqual({
      kind: 'clear',
    });
  });

  it('keeps an absent selection when there are no options', () => {
    // Nothing to reconcile to and nothing stale to remove — avoids a pointless
    // RESET write on first load for a user who has no groups.
    expect(reconcileGroupContextSelection(undefined, [])).toEqual({ kind: 'keep' });
  });
});