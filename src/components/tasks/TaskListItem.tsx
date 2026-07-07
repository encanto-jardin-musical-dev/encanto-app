'use client';

import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import useDeleteTaskMutation from '@/hooks/UseDeleteTaskMutation';
import type { StaffTaskRow } from '@/queries/tasks/get-staff-tasks';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type TaskListItemProps = {
  task: StaffTaskRow;
};

export function TaskListItem({ task }: TaskListItemProps) {
  const t = useTranslations('TasksPage');
  const format = useFormatter();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTaskMutation();

  const detailRoute = `/tasks/${task.group_id}/${task.id}`;

  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' } as const;

  const handleAction = (key: string) => {
    if (key === 'view') {
      router.push(detailRoute);
    } else if (key === 'edit') {
      router.push(`${detailRoute}?edit=1`);
    } else if (key === 'delete') {
      setIsDeleteOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id, {
      onSuccess: () => {
        addToast({ title: t('toasts.deleteSuccess'), color: 'success' });
        setIsDeleteOpen(false);
      },
      onError: () => {
        addToast({ title: t('toasts.deleteError'), color: 'danger' });
      },
    });
  };

  return (
    <div className="bg-default-100 rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex flex-col">
        <span className="font-medium text-foreground truncate">{task.title}</span>
        <span className="text-small text-default-500">
          {t('list.createdLabel', {
            date: task.created_at ? format.dateTime(new Date(task.created_at), dateOptions) : '—',
          })}
          {task.due_date
            ? ` · ${t('list.dueLabel', { date: format.dateTime(new Date(task.due_date), dateOptions) })}`
            : ''}
        </span>
      </div>
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="light" aria-label={t('actions.view')}>
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label={t('actions.view')} onAction={(key) => handleAction(String(key))}>
          <DropdownItem key="view">{t('actions.view')}</DropdownItem>
          <DropdownItem key="edit">{t('actions.edit')}</DropdownItem>
          <DropdownItem key="delete" className="text-danger" color="danger">
            {t('actions.delete')}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        isPending={isDeleting}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        labels={{
          title: t('deleteModal.title'),
          message: t('deleteModal.message', { title: task.title }),
          cancel: t('deleteModal.cancel'),
          confirm: t('deleteModal.confirm'),
        }}
      />
    </div>
  );
}
