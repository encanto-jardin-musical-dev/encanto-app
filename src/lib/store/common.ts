import { atom } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";

import { getGroupContextValue, getSelectionFromStoredValue } from "@/utils/jotai";

import type { Key } from "@react-types/shared";
import type { Selection } from "@heroui/react";

const initialDerivedValueForContextGroup = getGroupContextValue(undefined);

export const contextGroup = atomWithStorage<Key | string>(
  "groupContext",
  initialDerivedValueForContextGroup
);

export const groupContextSelectedAtom = atom<
  Selection | undefined,
  [newSelection: Selection | undefined | typeof RESET],
  void
>(
  (get) => {
    const valueFromStorage = get(contextGroup);
    return getSelectionFromStoredValue(valueFromStorage);
  },
  (get, set, newSelectionUpdate) => {
    if (newSelectionUpdate === RESET) {
      set(contextGroup, RESET);
    } else {
      const derivedValueToStore = getGroupContextValue(newSelectionUpdate);
      set(contextGroup, derivedValueToStore);
    }
  }
);

export const contextGroupValue = atom((get) => {
  const currentGroupContext = get(groupContextSelectedAtom);
  return getGroupContextValue(currentGroupContext);
});

