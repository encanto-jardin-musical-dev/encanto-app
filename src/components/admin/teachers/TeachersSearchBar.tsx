"use client";
import { AdminSearchBar } from "@/components/common/AdminSearchBar";
import { useTranslations } from "next-intl";

type TeachersSearchBarProps = {
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function TeachersSearchBar({ onSearch, debounceMs = 300 }: TeachersSearchBarProps) {
  const t = useTranslations("AdminTeachers.list");
  return (
    <AdminSearchBar
      placeholder={t("searchPlaceholder")}
      onSearch={onSearch}
      debounceMs={debounceMs}
    />
  );
}
