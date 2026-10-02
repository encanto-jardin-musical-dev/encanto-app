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

  const { data: userChildren, isPending: childrenPending } = useUserChildrenQuery({
    params: { userID: localUserId },
    options: {
      enabled: !!localUserId && localUserRole === USER_ROLES.PARENT,
    },
  });
  const { data: userGroups, isPending: groupsPending } = useUserGroupsQuery(localUserId, {
    enabled: !!localUserId && localUserRole === USER_ROLES.TEACHER,
  });
  const { data: allGroups, isPending: allGroupsPending } = useUserAllGroupsQuery({
    enabled: !!localUserId && localUserRole === USER_ROLES.ADMIN,
  });

  const buildAndSetOptions = useCallback(() => {
    if (!localUserId) return;

    // Each role branch bails out while its query is still pending so that an empty
    // option list only ever means "this user genuinely has no groups", never "not
    // loaded yet". The Feed's group-context reconcile in `FeedUser` depends on
    // that distinction: clearing a persisted selection is correct for the former
    // and destructive for the latter.
    if (localUserRole === USER_ROLES.ADMIN) {
      if (allGroupsPending) return;
      const formatted = Array.isArray(allGroups)
        ? allGroups.map(group => ({
            key: group?.id as Key,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatted);
    } else if (localUserRole === USER_ROLES.TEACHER) {
      if (groupsPending) return;
      const formatted = Array.isArray(userGroups)
        ? userGroups.map(group => ({
            key: group?.id as Key,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatted);
    } else {
      if (childrenPending) return;
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
    allGroupsPending,
    userGroups,
    groupsPending,
    userChildren,
    childrenPending,
    setSelectOptions,
  ]);

  useEffect(() => {
    buildAndSetOptions();
  }, [buildAndSetOptions]);

  return null;
}
