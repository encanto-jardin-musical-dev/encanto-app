"use client";
import { userIdAtom, userRoleAtom } from "@/lib/store/user";
import { useAtomValue } from "jotai";
import { notFound } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import type { ReactNode } from "react";
import type { UserRoles } from "@/types/common.types";

type FeatureFlagRoleGateProps = {
  flag: string;
  allowedRoles: UserRoles[];
  children: ReactNode;
};

/**
 * Gates content behind a feature flag and allowed user roles. Renders nothing
 * until the user atom is hydrated and the flag has resolved, so a real user
 * is never bounced to not-found during the brief pre-hydration window.
 */
export function FeatureFlagRoleGate({ flag, allowedRoles, children }: FeatureFlagRoleGateProps) {
  const userId = useAtomValue(userIdAtom);
  const userRole = useAtomValue(userRoleAtom);
  const flagEnabled = useFeatureFlagEnabled(flag);

  const isHydrated = !!userId;
  const isAllowedRole = allowedRoles.includes(userRole);

  if (!isHydrated || flagEnabled === undefined) {
    return null;
  }

  if (flagEnabled !== true || !isAllowedRole) {
    notFound();
  }

  return <>{children}</>;
}