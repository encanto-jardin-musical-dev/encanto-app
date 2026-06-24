"use client";

import { ConfirmDeleteModal } from "@/components/common/ConfirmDeleteModal";
import { useTranslations } from "next-intl";

interface ConfirmDeleteGroupModalProps {
  groupName: string;
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteGroupModal({
  groupName,
  isOpen,
  isPending,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteGroupModalProps) {
  const t = useTranslations("AdminGroups");

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      labels={{
        title: t("deleteModal.title"),
        message: t("deleteModal.message", { name: groupName }),
        cancel: t("deleteModal.cancel"),
        confirm: t("deleteModal.confirm"),
      }}
    />
  );
}
