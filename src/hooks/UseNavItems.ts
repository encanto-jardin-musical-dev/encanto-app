"use client";

import {
  FEED_NAV_ITEM,
  filterNavItems,
  MESSAGES_NAV_ITEM,
  STAFF_ACTIONS,
  type NavItem,
} from "@/components/common/navigation";
import { USER_ROLES } from "@/lib/const";
import { userRoleAtom } from "@/lib/store/user";
import { useAtom } from "jotai";
import { useFeatureFlagEnabled } from "posthog-js/react";

function useActionFlagState(): Record<string, boolean> {
  // Per-action feature flags. Hooks must run unconditionally and in a stable
  // order, so each flag is read here regardless of role. Both `false` and
  // `undefined` (still loading) are treated as off via the `=== true` check.
  return {
    admin_options_attendance:
      useFeatureFlagEnabled("admin_options_attendance") === true,
    admin_options_reports:
      useFeatureFlagEnabled("admin_options_reports") === true,
    admin_options_tasks: useFeatureFlagEnabled("admin_options_tasks") === true,
  };
}

export function useStaffActionItems(): {
  isStaff: boolean;
  actions: NavItem[];
} {
  const [userRole] = useAtom(userRoleAtom);
  const flagState = useActionFlagState();
  const isStaff =
    userRole === USER_ROLES.TEACHER || userRole === USER_ROLES.ADMIN;

  return {
    isStaff,
    actions: filterNavItems(STAFF_ACTIONS, {
      userRole,
      flagState,
      adminRole: USER_ROLES.ADMIN,
    }),
  };
}

export function useNavItems(): NavItem[] {
  const [userRole] = useAtom(userRoleAtom);
  const flagState = useActionFlagState();
  const isStaff =
    userRole === USER_ROLES.TEACHER || userRole === USER_ROLES.ADMIN;

  if (!isStaff) {
    return [FEED_NAV_ITEM, MESSAGES_NAV_ITEM];
  }

  const staffItems = filterNavItems(STAFF_ACTIONS, {
    userRole,
    flagState,
    adminRole: USER_ROLES.ADMIN,
  });

  return [FEED_NAV_ITEM, ...staffItems];
}
