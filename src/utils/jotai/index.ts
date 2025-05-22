import type { Selection } from "@heroui/react";
import type { Key } from "@react-types/shared";

const ALL_SELECTION_STORAGE_MARKER = "__ALL_ITEMS_SELECTED__";

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
