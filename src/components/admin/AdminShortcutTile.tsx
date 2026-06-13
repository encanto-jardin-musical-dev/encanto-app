"use client";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

type AdminShortcutTileProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
};

export function AdminShortcutTile({ icon: Icon, label, route }: AdminShortcutTileProps) {
  const router = useRouter();

  return (
    <Button
      variant="flat"
      aria-label={label}
      className="flex flex-col items-center justify-center gap-1 h-16 w-16 rounded-xl bg-default-100"
      onPress={() => router.push(route)}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
