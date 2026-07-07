'use client';

import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import MessageAttachments from '@/components/messages/MessageAttachments';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { useAttachmentUrlsQuery } from '@/hooks/UseAttachmentUrlsQuery';
import useDeleteTaskMutation from '@/hooks/UseDeleteTaskMutation';
import useTaskByIdQuery from '@/hooks/UseTaskByIdQuery';
import useUpdateTaskMutation from '@/hooks/UseUpdateTaskMutation';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { Attachment } from '@/types/messages.types';
import { addToast, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Skeleton } from '@heroui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { useFormatter, useTranslations } from 'next-intl';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { TaskForm, TaskFormRef } from './TaskForm';

type TaskDetailProps = {
  taskId: string;
};

export function TaskDetail({ taskId }: TaskDetailProps) {
  const t = useTranslations('TasksPage');
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const isStaff = user.role === USER_ROLES.TEACHER || user.role === USER_ROLES.ADMIN;

  const { data: task, isPending, isSuccess } = useTaskByIdQuery(taskId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTaskMutation();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTaskMutation();

  const [isEditing, setIsEditing] = useState(() => isStaff && searchParams.get('edit') === '1');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const formRef = useRef<TaskFormRef>(null);

  const attachments: Attachment[] = Array.isArray(task?.attachments)
    ? (task.attachments as unknown as Attachment[])
    : [];

  const { signedUrlMap, isLoading: isSigningUrls, isError: isSigningError } = useAttachmentUrlsQuery({
    requests: attachments.map((attachment) => ({ messageId: taskId, attachment })),
    enabled: attachments.length > 0,
  });

  if (isSuccess && !task) {
    notFound();
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  if (!task) return null;

  const handleSave = () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    updateTask(
      {
        taskId: task.id,
        title: values.title,
        groupId: values.groupId,
        dueDate: values.dueDate,
        description: values.description || null,
        attachments: values.attachments,
      },
      {
        onSuccess: () => {
          addToast({ title: t('toasts.updateSuccess'), color: 'success' });
          setIsEditing(false);
          router.replace(`/tasks/${values.groupId}/${task.id}`);
        },
        onError: () => {
          addToast({ title: t('toasts.updateError'), color: 'danger' });
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id, {
      onSuccess: () => {
        addToast({ title: t('toasts.deleteSuccess'), color: 'success' });
        router.push('/tasks');
      },
      onError: () => {
        addToast({ title: t('toasts.deleteError'), color: 'danger' });
      },
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-4 pb-20">
        <TaskForm
          ref={formRef}
          defaultValues={{
            title: task.title,
            groupId: task.group_id ?? '',
            dueDate: task.due_date,
            description: task.description,
            attachments,
          }}
        />
        <AdminActionButton variant="save" namespace="TasksPage" onPress={handleSave} isLoading={isUpdating} />
      </div>
    );
  }

  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' } as const;

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
          <p className="text-small text-default-500">
            {t('detail.groupLabel')}: {task.groups?.name ?? '—'}
          </p>
        </div>
        {isStaff && (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" aria-label={t('actions.edit')}>
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={t('actions.edit')}
              onAction={(key) => {
                if (key === 'edit') setIsEditing(true);
                if (key === 'delete') setIsDeleteOpen(true);
              }}
            >
              <DropdownItem key="edit">{t('actions.edit')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger">
                {t('actions.delete')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>

      <div className="flex flex-col gap-1 text-small text-default-500">
        <span>
          {t('detail.createdLabel')}: {task.created_at ? format.dateTime(new Date(task.created_at), dateOptions) : '—'}
        </span>
        {task.due_date && (
          <span>
            {t('detail.dueLabel')}: {format.dateTime(new Date(task.due_date), dateOptions)}
          </span>
        )}
      </div>

      {task.description && (
        <div>
          <h3 className="text-small font-medium text-foreground">{t('detail.descriptionLabel')}</h3>
          <p className="text-default-700 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {attachments.length > 0 && (
        <div>
          <h3 className="text-small font-medium text-foreground mb-1">{t('detail.attachmentsLabel')}</h3>
          <MessageAttachments
            attachments={attachments}
            signedUrls={signedUrlMap}
            isLoading={isSigningUrls}
            isError={isSigningError}
          />
        </div>
      )}

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
