"use client";
import { AdminSearchBar } from "@/components/common/AdminSearchBar";
import { useTranslations } from "next-intl";

type ParentsSearchBarProps = {
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function ParentsSearchBar({ onSearch, debounceMs = 300 }: ParentsSearchBarProps) {
  const t = useTranslations("AdminParents.list");
  return (
    <AdminSearchBar
      placeholder={t("searchPlaceholder")}
      onSearch={onSearch}
      debounceMs={debounceMs}
    />
  );
}
