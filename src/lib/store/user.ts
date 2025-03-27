import { atom } from "jotai";
import { groupContextSelectedAtom } from ".";

type SelectOptions = {
  key: string | number;
  label: string;
};

export const userFirstNameAtom = atom("");
export const userLastNameAtom = atom("");
export const userRoleAtom = atom("");
export const userIdAtom = atom("");
export const userSelectOptionsAtom = atom<SelectOptions[]>([]);
export const userAvatarAtom = atom("");
export const userChildrenGroupAtom = atom();
export const userGroupIdAtom = atom("");

export const userAtom = atom((get) => ({
  id: get(userIdAtom),
  name: `${get(userFirstNameAtom)} ${get(userLastNameAtom)}`,
  groupContext: get(groupContextSelectedAtom),
  ...(get(userRoleAtom) !== "parent"
    ? { groups: get(userSelectOptionsAtom) }
    : { children: get(userSelectOptionsAtom) }),
}));
