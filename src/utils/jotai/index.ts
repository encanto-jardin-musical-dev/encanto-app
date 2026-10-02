import type { Selection } from "@heroui/react";
import type { Key } from "@react-types/shared";

const ALL_SELECTION_STORAGE_MARKER = "__ALL_ITEMS_SELECTED__";

/** UI-level fallback a `Select` renders when nothing is selected. Not a real choice. */
export const ALL_SELECTION_KEY = "all";

export type GroupContextReconciliation =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "select"; selection: Selection };

/**
 * Reconciles a persisted group selection against the options currently offered.
 *
 * The selection is persisted to localStorage, so a stored key can outlive the
 * user's access to it (a teacher unassigned from a group, for example). Leaving
 * such a key in place would keep the feed pointed at that group, and the
 * `tasks` / `daily_reports` RLS policies grant any staff user a blanket read, so
 * the stale group would keep returning rows. `ALL_SELECTION_KEY` is a `Select`
 * fallback rather than a real choice, so it is invalid too — as is the storage
 * marker, which `getSelectionFromStoredValue` resolves to `ALL_SELECTION_KEY`.
 *
 * An empty `optionKeys` means the user genuinely has no options — callers must
 * only reach here once the options have resolved, never mid-load.
 */
export const reconcileGroupContextSelection = (
  selection: Selection | undefined,
  optionKeys: Key[]
): GroupContextReconciliation => {
  if (optionKeys.length === 0) {
    return selection === undefined ? { kind: "keep" } : { kind: "clear" };
  }

  const selectedKey =
    selection instanceof Set ? selection.values().next().value : selection;

  const isStillOffered =
    selectedKey !== undefined &&
    selectedKey !== "" &&
    selectedKey !== ALL_SELECTION_KEY &&
    optionKeys.includes(selectedKey);

  if (isStillOffered) {
    return { kind: "keep" };
  }

  return { kind: "select", selection: new Set([optionKeys[0]]) };
};

export const getGroupContextValue = (groupContext: Selection | undefined): Key | string => {
  if (groupContext === 'all') {
    return ALL_SELECTION_STORAGE_MARKER;
  }
  if (groupContext instanceof Set) {
    if (groupContext.size > 0) {
      const firstValue = groupContext.values().next().value;
      return firstValue !== undefined ? firstValue : "";
    }
    return "";
  }
  return "";
};

export const getSelectionFromStoredValue = (storedValue: Key | string | undefined) => {
  if (storedValue === undefined) {
    return undefined;
  }
  if (storedValue === ALL_SELECTION_STORAGE_MARKER) {
    return "all";
  }
  if (storedValue === "") {
    return undefined;
  }
  if (typeof storedValue === 'string' || typeof storedValue === 'number') {
    return new Set([storedValue]);
  }
  return undefined;

}
