'use client';

import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { useTranslations } from 'next-intl';

interface ConfirmDeleteTeacherModalProps {
  teacherName: string;
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteTeacherModal({
  teacherName,
  isOpen,
  isPending,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteTeacherModalProps) {
  const t = useTranslations('AdminTeachers');

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      labels={{
        title: t('deleteModal.title'),
        message: t('deleteModal.message', { name: teacherName }),
        cancel: t('deleteModal.cancel'),
        confirm: t('deleteModal.confirm'),
      }}
    />
  );
}
