"use client";
import useGroupChildrenQuery from "@/hooks/UseGroupChildrenQuery";
import type { GroupChildRow } from "@/queries/attendance/get-group-children";
import { Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";

type ReportChildSelectProps = {
  groupId: string | null;
  value: string | null;
  onChange: (child: GroupChildRow | null) => void;
};

/** Single-selection child picker; disabled until a group is chosen. */
export function ReportChildSelect({ groupId, value, onChange }: ReportChildSelectProps) {
  const t = useTranslations("AttendanceReport");
  const { data: children, isPending } = useGroupChildrenQuery(groupId ?? undefined);
  const list = children ?? [];

  return (
    <Select
      label={t("childLabel")}
      placeholder={groupId ? t("childPlaceholder") : t("childPlaceholderDisabled")}
      isDisabled={!groupId}
      isLoading={!!groupId && isPending}
      selectionMode="single"
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={(keys) => {
        const [first] = [...keys];
        onChange(list.find((c) => c.id === first) ?? null);
      }}
      items={list}
      description={groupId && !isPending && list.length === 0 ? t("noChildren") : undefined}
    >
      {(child) => (
        <SelectItem key={child.id} textValue={`${child.first_name} ${child.last_name}`}>
          {child.first_name} {child.last_name}
        </SelectItem>
      )}
    </Select>
  );
}
