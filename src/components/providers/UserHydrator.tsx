'use client';

import useUserAllGroupsQuery from '@/hooks/UseGetAllGroupsQuery';
import useUserChildrenQuery from '@/hooks/UseGetUserChildrenQuery';
import useUserGroupsQuery from '@/hooks/UseGetUserGroupsQuery';
import { USER_ROLES } from '@/lib/const';
import { groupContextSelectedAtom } from '@/lib/store/common';
import {
  userAvatarAtom,
  userFirstNameAtom,
  userIdAtom,
  userLastNameAtom,
  userRoleAtom,
  userSelectOptionsAtom,
} from '@/lib/store/user';
import { getProfileById } from '@/queries/users/get-profile-by-id';
import { reconcileGroupContextSelection } from '@/utils/jotai';
import { createClient } from '@/utils/supabase/client';
import type { Key } from '@react-types/shared';
import { useAtomValue, useSetAtom } from 'jotai';
import { RESET } from 'jotai/utils';
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
  const groupContextSelection = useAtomValue(groupContextSelectedAtom);
  const setGroupContextSelection = useSetAtom(groupContextSelectedAtom);
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
    // loaded yet". The group-context reconcile below depends on that distinction:
    // clearing a persisted selection is correct for the former and destructive for
    // the latter.
    let options: { key: Key; label: string }[];

    if (localUserRole === USER_ROLES.ADMIN) {
      if (allGroupsPending) return;
      options = Array.isArray(allGroups)
        ? allGroups.map(group => ({
            key: group?.id as Key,
            label: group?.name,
          }))
        : [];
    } else if (localUserRole === USER_ROLES.TEACHER) {
      if (groupsPending) return;
      options = Array.isArray(userGroups)
        ? userGroups.map(group => ({
            key: group?.id as Key,
            label: group?.name,
          }))
        : [];
    } else {
      if (childrenPending) return;
      options = Array.isArray(userChildren)
        ? userChildren.map(child => ({
            key: child?.children?.child_groups[0]?.group_id as Key,
            label: `${child?.children?.first_name} ${child?.children?.last_name}`,
          }))
        : [];
    }

    setSelectOptions(options);

    // The group context is app-wide state — `MessageInput` reads it to tag a
    // teacher's outgoing message, and the feed reads it to scope queries — so it
    // is established here rather than only when the Feed happens to mount.
    // Otherwise a teacher navigating straight to /messages would have no context
    // and could not send. Reconcile it against the groups actually offered, so a
    // key persisted from a group the user no longer belongs to is replaced.
    const outcome = reconcileGroupContextSelection(
      groupContextSelection,
      options.map(option => option.key)
    );

    if (outcome.kind === 'clear') {
      setGroupContextSelection(RESET);
    } else if (outcome.kind === 'select') {
      setGroupContextSelection(outcome.selection);
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
    groupContextSelection,
    setGroupContextSelection,
    setSelectOptions,
  ]);

  useEffect(() => {
    buildAndSetOptions();
  }, [buildAndSetOptions]);

  return null;
}
