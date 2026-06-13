"use client";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Input } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ChildrenSearchBarProps = {
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function ChildrenSearchBar({ onSearch, debounceMs = 300 }: ChildrenSearchBarProps) {
  const t = useTranslations("AdminChildren.list");
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <Input
      placeholder={t("searchPlaceholder")}
      isClearable
      type="search"
      startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
      variant="bordered"
      value={value}
      onValueChange={setValue}
      onClear={() => setValue("")}
    />
  );
}
