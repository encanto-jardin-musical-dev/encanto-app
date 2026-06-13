'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useTranslations } from 'next-intl';

interface ConfirmDeleteChildModalProps {
  childName: string;
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteChildModal({
  childName,
  isOpen,
  isPending,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteChildModalProps) {
  const t = useTranslations('AdminChildren');

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-danger">{t('deleteModal.title')}</ModalHeader>
            <ModalBody>
              <p className="text-default-700">
                {t('deleteModal.message', { name: childName })}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isPending}>
                {t('deleteModal.cancel')}
              </Button>
              <Button color="danger" onPress={onConfirm} isLoading={isPending}>
                {t('deleteModal.confirm')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
