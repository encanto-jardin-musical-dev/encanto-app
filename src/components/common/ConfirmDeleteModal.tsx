"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

type ConfirmDeleteModalLabels = {
  title: string;
  message: string;
  cancel: string;
  confirm: string;
};

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  /** Resolved label strings from the caller's translation namespace. */
  labels: ConfirmDeleteModalLabels;
}

/**
 * Generic confirm-delete modal.
 * Callers resolve their own label strings so translation namespaces stay in the domain layer.
 */
export function ConfirmDeleteModal({
  isOpen,
  isPending,
  onOpenChange,
  onConfirm,
  labels,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-danger">{labels.title}</ModalHeader>
            <ModalBody>
              <p className="text-default-700">{labels.message}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isPending}>
                {labels.cancel}
              </Button>
              <Button color="danger" onPress={onConfirm} isLoading={isPending}>
                {labels.confirm}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
