import { TypedSupabaseClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';

type TableName = keyof Database['public']['Tables'];

export type ReconcileLinksConfig<T> = {
  /** The join table to operate on. */
  table: TableName;
  /** Column name for the "parent" side of the link (e.g. 'child_id', 'group_id'). */
  parentColumn: string;
  /** Column name for the "child" side of the link (e.g. 'group_id', 'teacher_id'). */
  childColumn: string;
  /** ID of the parent entity. */
  parentId: string;
  /** The desired set of linked items (current selection). */
  desired: T[];
  /** Extract the child-side key from a desired item. */
  getKey: (item: T) => string;
  /** Build the full insert row from a desired item. Must include parentColumn and childColumn. */
  buildRow: (item: T) => Record<string, unknown>;
  /**
   * Optional: field names on the row that may differ between an existing link and a desired item.
   * When set, existing links whose key is unchanged but whose mutable fields differ are
   * deleted and re-inserted so they stay in sync (e.g. guardian `relationship`).
   */
  mutableFields?: (keyof T)[];
};

/**
 * Reconciles a join table so it matches exactly the `desired` set for a given parent.
 *
 * Algorithm:
 * 1. Fetch existing rows for the parent.
 * 2. Compute `toAdd` (desired keys not in existing) and `toRemove` (existing keys not desired).
 * 3. When `mutableFields` is set: also update existing rows whose mutable fields changed.
 * 4. Insert new rows; delete removed rows.
 */
export async function reconcileLinks<T>(
  client: TypedSupabaseClient,
  cfg: ReconcileLinksConfig<T>
): Promise<void> {
  const { table, parentColumn, childColumn, parentId, desired, getKey, buildRow, mutableFields } =
    cfg;

  // 1. Fetch existing links
  const { data: existing, error: fetchError } = await (client.from(table) as ReturnType<typeof client.from>)
    .select(mutableFields ? `${childColumn}, ${mutableFields.join(', ')}` : childColumn)
    .eq(parentColumn, parentId);

  if (fetchError) {
    throw new Error(`reconcileLinks: failed to fetch from ${table}: ${fetchError.message}`);
  }

  const existingRows = (existing ?? []) as unknown as Record<string, unknown>[];
  const existingKeys = existingRows.map((r) => r[childColumn] as string).filter(Boolean);

  const desiredKeys = desired.map(getKey);

  const toAdd = desired.filter((item) => !existingKeys.includes(getKey(item)));
  const toRemoveKeys = existingKeys.filter((k) => !desiredKeys.includes(k));

  // 2. Handle mutable-field re-sync (e.g. guardian relationship changed)
  if (mutableFields && mutableFields.length > 0) {
    const toReplace: T[] = [];
    const toReplaceKeys: string[] = [];

    for (const item of desired) {
      const key = getKey(item);
      if (!existingKeys.includes(key)) continue; // already in toAdd
      const existingRow = existingRows.find((r) => r[childColumn] === key);
      if (!existingRow) continue;
      const changed = mutableFields.some(
        (field) => existingRow[field as string] !== (item as Record<string, unknown>)[field as string]
      );
      if (changed) {
        toReplace.push(item);
        toReplaceKeys.push(key);
      }
    }

    if (toReplaceKeys.length > 0) {
      // Delete the stale rows first
      const { error: delErr } = await (client.from(table) as ReturnType<typeof client.from>)
        .delete()
        .eq(parentColumn, parentId)
        .in(childColumn, toReplaceKeys);
      if (delErr) {
        throw new Error(`reconcileLinks: failed to delete stale rows in ${table}: ${delErr.message}`);
      }
      // Re-insert with updated payload
      const { error: insErr } = await (client.from(table) as ReturnType<typeof client.from>)
        .insert(toReplace.map(buildRow) as Parameters<ReturnType<typeof client.from>['insert']>[0]);
      if (insErr) {
        throw new Error(`reconcileLinks: failed to re-insert updated rows in ${table}: ${insErr.message}`);
      }
    }
  }

  // 3. Insert added links
  if (toAdd.length > 0) {
    const { error: addError } = await (client.from(table) as ReturnType<typeof client.from>)
      .insert(toAdd.map(buildRow) as Parameters<ReturnType<typeof client.from>['insert']>[0]);
    if (addError) {
      throw new Error(`reconcileLinks: failed to insert into ${table}: ${addError.message}`);
    }
  }

  // 4. Delete removed links
  if (toRemoveKeys.length > 0) {
    const { error: removeError } = await (client.from(table) as ReturnType<typeof client.from>)
      .delete()
      .eq(parentColumn, parentId)
      .in(childColumn, toRemoveKeys);
    if (removeError) {
      throw new Error(`reconcileLinks: failed to delete from ${table}: ${removeError.message}`);
    }
  }
}
