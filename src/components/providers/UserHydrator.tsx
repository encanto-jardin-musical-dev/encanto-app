'use client';

import useUserAllGroupsQuery from '@/hooks/UseGetAllGroupsQuery';
import useUserChildrenQuery from '@/hooks/UseGetUserChildrenQuery';
import useUserGroupsQuery from '@/hooks/UseGetUserGroupsQuery';
import { USER_ROLES } from '@/lib/const';
import {
  userAvatarAtom,
  userFirstNameAtom,
  userIdAtom,
  userLastNameAtom,
  userRoleAtom,
  userSelectOptionsAtom,
} from '@/lib/store/user';
import { getProfileById } from '@/queries/users/get-profile-by-id';
import { createClient } from '@/utils/supabase/client';
import type { Key } from '@react-types/shared';
import { useSetAtom } from 'jotai';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useState } from 'react';

type UserRole = 'parent' | 'teacher' | 'admin';

export function UserHydrator() {
  const setUserId = useSetAtom(userIdAtom);
  const setUserRole = useSetAtom(userRoleAtom);
  const setUserFirstName = useSetAtom(userFirstNameAtom);
  const setUserLastName = useSetAtom(userLastNameAtom);
  const setUserAvatar = useSetAtom(userAvatarAtom);
  const setSelectOptions = useSetAtom(userSelectOptionsAtom);
  const posthog = usePostHog();

  const [localUserId, setLocalUserId] = useState('');
  const [localUserRole, setLocalUserRole] = useState<UserRole>('parent');

  useEffect(() => {
    const hydrate = async () => {
      const client = createClient();
      let user;
      try {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) return;
        user = data.user;
      } catch {
        // No active session — user is not logged in, nothing to hydrate
        return;
      }

      const profile = await getProfileById(client, user.id);
      if (!profile) return;

      const role = profile.role as UserRole;
      setUserId(profile.id);
      setUserRole(role);
      setUserFirstName(profile.first_name ?? '');
      setUserLastName(profile.last_name ?? '');
      setUserAvatar(profile.avatar_url ?? '');
      setLocalUserId(profile.id);
      setLocalUserRole(role);
      posthog.identify(profile.id);
    };
    hydrate();
  }, [
    setUserId,
    setUserRole,
    setUserFirstName,
    setUserLastName,
    setUserAvatar,
    posthog,
  ]);

  const { data: userChildren } = useUserChildrenQuery({
    params: { userID: localUserId },
    options: {
      enabled: !!localUserId && localUserRole === USER_ROLES.PARENT,
    },
  });
  const { data: userGroups } = useUserGroupsQuery(localUserId, {
    enabled: !!localUserId && localUserRole === USER_ROLES.TEACHER,
  });
  const { data: allGroups } = useUserAllGroupsQuery({
    enabled: !!localUserId && localUserRole === USER_ROLES.ADMIN,
  });

  const buildAndSetOptions = useCallback(() => {
    if (!localUserId) return;
    if (localUserRole === USER_ROLES.ADMIN) {
      const formatted = Array.isArray(allGroups)
        ? allGroups.map(group => ({
            key: group?.id as Key,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatted);
    } else if (localUserRole === USER_ROLES.TEACHER) {
      const formatted = Array.isArray(userGroups)
        ? userGroups.map(group => ({
            key: group?.id as Key,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatted);
    } else {
      const formatted = Array.isArray(userChildren)
        ? userChildren.map(child => ({
            key: child?.children?.child_groups[0]?.group_id as Key,
            label: `${child?.children?.first_name} ${child?.children?.last_name}`,
          }))
        : [];
      setSelectOptions(formatted);
    }
  }, [
    localUserId,
    localUserRole,
    allGroups,
    userGroups,
    userChildren,
    setSelectOptions,
  ]);

  useEffect(() => {
    buildAndSetOptions();
  }, [buildAndSetOptions]);

  return null;
}
