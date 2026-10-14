"use client";
import useAttendanceGroupsQuery from "@/hooks/UseAttendanceGroupsQuery";
import { USER_ROLES } from "@/lib/const";
import { userAtom } from "@/lib/store/user";
import { Select, SelectItem } from "@heroui/react";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";

type ReportGroupSelectProps = {
  value: string | null;
  onChange: (groupId: string | null) => void;
};

/** Teachers see their assigned groups; admins see all. No "all groups" option. */
export function ReportGroupSelect({ value, onChange }: ReportGroupSelectProps) {
  const t = useTranslations("AttendanceReport");
  const user = useAtomValue(userAtom);
  const isAdmin = user.role === USER_ROLES.ADMIN;
  const { data: groups, isPending } = useAttendanceGroupsQuery(isAdmin ? undefined : user.id);

  return (
    <Select
      label={t("groupLabel")}
      placeholder={t("groupPlaceholder")}
      isLoading={isPending}
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={(keys) => {
        const [first] = [...keys];
        onChange(first ? String(first) : null);
      }}
      items={groups ?? []}
      description={!isPending && (groups ?? []).length === 0 ? t("noGroups") : undefined}
    >
      {(group) => <SelectItem key={group.id}>{group.name}</SelectItem>}
    </Select>
  );
}
