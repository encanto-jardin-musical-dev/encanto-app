"use client";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Input } from "@heroui/react";
import { useEffect, useState } from "react";

type AdminSearchBarProps = {
  placeholder: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
};

/**
 * Debounced search input for admin list screens.
 * Callers pass a resolved placeholder string from their namespace.
 */
export function AdminSearchBar({ placeholder, onSearch, debounceMs = 300 }: AdminSearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <Input
      placeholder={placeholder}
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
