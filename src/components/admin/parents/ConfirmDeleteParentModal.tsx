'use client';

import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { useTranslations } from 'next-intl';

interface ConfirmDeleteParentModalProps {
  parentName: string;
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteParentModal({
  parentName,
  isOpen,
  isPending,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteParentModalProps) {
  const t = useTranslations('AdminParents');

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      labels={{
        title: t('deleteModal.title'),
        message: t('deleteModal.message', { name: parentName }),
        cancel: t('deleteModal.cancel'),
        confirm: t('deleteModal.confirm'),
      }}
    />
  );
}
