"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-danger">{t("deleteModal.title")}</ModalHeader>
            <ModalBody>
              <p className="text-default-700">
                {t("deleteModal.message", { name: groupName })}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isPending}>
                {t("deleteModal.cancel")}
              </Button>
              <Button color="danger" onPress={onConfirm} isLoading={isPending}>
                {t("deleteModal.confirm")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
