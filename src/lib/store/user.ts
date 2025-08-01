import type { Selection } from '@heroui/react';
import { atom } from 'jotai';
import { USER_ROLES } from '../const';
import { groupContextSelectedAtom } from './common';

type SelectOptions = {
  key: string | number;
  label: string;
};

type UserRole = 'parent' | 'teacher' | 'admin';

interface BaseUser {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string;
  groupContext: Selection | undefined;
}

interface ParentUser extends BaseUser {
  role: 'parent';
  children: SelectOptions[];
}

interface StaffUser extends BaseUser {
  role: 'teacher' | 'admin';
  groups: SelectOptions[];
}

type User = ParentUser | StaffUser;

export const userFirstNameAtom = atom('');
export const userLastNameAtom = atom('');
export const userRoleAtom = atom<UserRole>('parent');
export const userIdAtom = atom('');
export const userSelectOptionsAtom = atom<SelectOptions[]>([]);
export const userAvatarAtom = atom('');
export const userChildrenGroupAtom = atom();
export const userNotificationSettingsAtom = atom<boolean>(true);
export const pushNotificationPermissionAtom =
  atom<NotificationPermission>('default');

export const userAtom = atom((get): User => {
  const role = get(userRoleAtom);
  const baseUser: BaseUser = {
    id: get(userIdAtom),
    firstName: get(userFirstNameAtom),
    lastName: get(userLastNameAtom),
    role,
    avatar: get(userAvatarAtom),
    groupContext: get(groupContextSelectedAtom),
  };

  if (role === USER_ROLES.PARENT) {
    return {
      ...baseUser,
      role: 'parent',
      children: get(userSelectOptionsAtom),
    };
  }

  return {
    ...baseUser,
    role: role as 'teacher' | 'admin',
    groups: get(userSelectOptionsAtom),
  };
});
