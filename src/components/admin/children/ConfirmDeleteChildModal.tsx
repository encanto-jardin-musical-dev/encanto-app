'use client';

import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
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
    <ConfirmDeleteModal
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      labels={{
        title: t('deleteModal.title'),
        message: t('deleteModal.message', { name: childName }),
        cancel: t('deleteModal.cancel'),
        confirm: t('deleteModal.confirm'),
      }}
    />
  );
}
