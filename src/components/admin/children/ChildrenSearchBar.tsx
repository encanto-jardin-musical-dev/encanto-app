"use client";
import { AdminSearchBar } from "@/components/common/AdminSearchBar";
import { useTranslations } from "next-intl";

type ChildrenSearchBarProps = {
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function ChildrenSearchBar({ onSearch, debounceMs = 300 }: ChildrenSearchBarProps) {
  const t = useTranslations("AdminChildren.list");
  return (
    <AdminSearchBar
      placeholder={t("searchPlaceholder")}
      onSearch={onSearch}
      debounceMs={debounceMs}
    />
  );
}
