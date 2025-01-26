import { atom } from "jotai";
import type { Selection } from "@heroui/react";

type SelectOptions = {
  key: string | number;
  label: string;
};

export const userFirstNameAtom = atom("");
export const userLastNameAtom = atom("");
export const userRoleAtom = atom("");
export const userIdAtom = atom("");
export const userSelectOptionsAtom = atom<SelectOptions[]>([]);
export const userCurrentSelectionAtom = atom<Selection>();
export const userAvatarAtom = atom("");
export const userChildrenGroupAtom = atom();

export const userAtom = atom((get) => ({
  id: get(userIdAtom),
  name: `${get(userFirstNameAtom)} ${get(userLastNameAtom)}`,
  currentSelection: get(userCurrentSelectionAtom),
  ...(get(userRoleAtom) !== "parent"
    ? { groups: get(userSelectOptionsAtom) }
    : { children: get(userSelectOptionsAtom) }),
}));
