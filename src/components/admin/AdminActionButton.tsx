"use client";
import { PencilIcon, PlusIcon } from "@heroicons/react/24/solid";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

type AdminActionButtonVariant = "add" | "save" | "edit";

type AdminActionButtonProps = {
  variant: AdminActionButtonVariant;
  onPress: () => void;
  isLoading?: boolean;
};

const ICONS: Record<AdminActionButtonVariant, React.ComponentType<{ className?: string }>> = {
  add: PlusIcon,
  save: ArrowDownTrayIcon,
  edit: PencilIcon,
};

const LABEL_KEYS: Record<AdminActionButtonVariant, string> = {
  add: "actions.add",
  save: "actions.save",
  edit: "actions.edit",
};

export function AdminActionButton({ variant, onPress, isLoading = false }: AdminActionButtonProps) {
  const t = useTranslations("AdminChildren");
  const Icon = ICONS[variant];
  const label = t(LABEL_KEYS[variant]);

  return (
    <div className="fixed bottom-8 right-8">
      <Button
        isIconOnly
        aria-label={label}
        size="lg"
        color="primary"
        isLoading={isLoading}
        onPress={onPress}
      >
        {!isLoading && <Icon className="w-6 h-6" />}
      </Button>
    </div>
  );
}
