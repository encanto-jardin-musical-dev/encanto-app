"use client";
import { Select, SelectItem } from "@heroui/react";
import { useEffect } from "react";

type EntityMultiSelectProps<T> = {
  /** All available items to choose from */
  items: T[];
  /** Currently selected ids */
  selectedIds: string[];
  /** Called when the selection changes */
  onChange: (ids: string[]) => void;
  /** Extract the unique id from an item */
  getId: (item: T) => string;
  /** Build the display label for an item */
  getLabel: (item: T) => string;
  /** Select label */
  label: string;
  /** Select placeholder */
  placeholder: string;
  /**
   * When true (default), automatically purges selected ids that are no
   * longer present in `items` (e.g. a deleted entity) so HeroUI Select
   * never receives orphaned selectedKeys.
   */
  purgeOrphans?: boolean;
  className?: string;
  classNames?: Record<string, string>;
};

/**
 * Generic multi-select backed by HeroUI's `<Select selectionMode="multiple">`.
 * Handles orphan-id purging, key extraction, and label rendering in one place.
 */
export function EntityMultiSelect<T>({
  items,
  selectedIds,
  onChange,
  getId,
  getLabel,
  label,
  placeholder,
  purgeOrphans = true,
  className,
  classNames,
}: EntityMultiSelectProps<T>) {
  // Canonical orphan purge — remove selected ids that are no longer in items
  useEffect(() => {
    if (!purgeOrphans || items.length === 0) return;
    onChange(selectedIds.filter((id) => items.some((item) => getId(item) === id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const validSelectedIds = selectedIds.filter((id) => items.some((item) => getId(item) === id));

  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectionMode="multiple"
      selectedKeys={new Set(validSelectedIds)}
      onSelectionChange={(keys) => onChange([...keys] as string[])}
      className={className}
      classNames={classNames}
    >
      {items.map((item) => (
        <SelectItem key={getId(item)} textValue={getLabel(item)}>
          {getLabel(item)}
        </SelectItem>
      ))}
    </Select>
  );
}
