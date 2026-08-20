import {
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";

export type NavItem = {
  key: string;
  route: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  flag?: string;
};

export const FEED_NAV_ITEM: NavItem = {
  key: "feed",
  route: "/feed",
  icon: HomeIcon,
};

export const STAFF_ACTIONS: NavItem[] = [
  {
    key: "attendance",
    route: "/attendance",
    icon: ClockIcon,
    flag: "admin_options_attendance",
  },
  {
    key: "daily-report",
    route: "/reports",
    icon: ClipboardDocumentListIcon,
    flag: "admin_options_reports",
  },
  {
    key: "tasks",
    route: "/tasks",
    icon: DocumentCheckIcon,
    flag: "admin_options_tasks",
  },
  { key: "messages", route: "/messages", icon: ChatBubbleLeftIcon },
  {
    key: "admin-options",
    route: "/admin",
    icon: Cog6ToothIcon,
    adminOnly: true,
  },
];

export const MESSAGES_NAV_ITEM = STAFF_ACTIONS.find(
  (item) => item.key === "messages",
)!;

export function filterNavItems(
  items: NavItem[],
  options: {
    userRole: string;
    flagState: Record<string, boolean>;
    adminRole: string;
  },
): NavItem[] {
  const { userRole, flagState, adminRole } = options;
  return items.filter((action) => {
    const flagAllows = !action.flag || flagState[action.flag] === true;
    const roleAllows = !action.adminOnly || userRole === adminRole;
    return flagAllows && roleAllows;
  });
}
