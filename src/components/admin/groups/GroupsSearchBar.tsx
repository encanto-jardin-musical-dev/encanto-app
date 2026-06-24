"use client";
import { AdminSearchBar } from "@/components/common/AdminSearchBar";
import { useTranslations } from "next-intl";

type GroupsSearchBarProps = {
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function GroupsSearchBar({ onSearch, debounceMs = 300 }: GroupsSearchBarProps) {
  const t = useTranslations("AdminGroups.list");
  return (
    <AdminSearchBar
      placeholder={t("searchPlaceholder")}
      onSearch={onSearch}
      debounceMs={debounceMs}
    />
  );
}
