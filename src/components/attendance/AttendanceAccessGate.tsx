"use client";
import { USER_ROLES } from "@/lib/const";
import { userIdAtom, userRoleAtom } from "@/lib/store/user";
import { useAtomValue } from "jotai";
import { notFound } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import type { ReactNode } from "react";

type AttendanceAccessGateProps = {
  children: ReactNode;
};

/**
 * Gates attendance pages behind the `admin_options_attendance` flag and a
 * staff (teacher/admin) role. Renders nothing until the user atom is
 * hydrated and the flag has resolved, so a real staff user is never bounced
 * to not-found during the brief pre-hydration window (userRoleAtom defaults
 * to "parent" until UserHydrator runs).
 */
export function AttendanceAccessGate({ children }: AttendanceAccessGateProps) {
  const userId = useAtomValue(userIdAtom);
  const userRole = useAtomValue(userRoleAtom);
  const flagEnabled = useFeatureFlagEnabled("admin_options_attendance");

  const isHydrated = !!userId;
  const isStaff = userRole === USER_ROLES.TEACHER || userRole === USER_ROLES.ADMIN;

  if (!isHydrated || flagEnabled === undefined) {
    return null;
  }

  if (flagEnabled !== true || !isStaff) {
    notFound();
  }

  return <>{children}</>;
}
