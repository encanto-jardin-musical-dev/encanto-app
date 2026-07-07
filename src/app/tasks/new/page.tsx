'use client';

import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import NavigationBar from '@/components/common/NavigationBar';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { TaskForm, TaskFormRef } from '@/components/tasks/TaskForm';
import useCreateTaskMutation from '@/hooks/UseCreateTaskMutation';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { UserRoles } from '@/types/common.types';
import { addToast } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function NewTaskPage() {
  const t = useTranslations('TasksPage.form');
  const tToasts = useTranslations('TasksPage.toasts');
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const formRef = useRef<TaskFormRef>(null);
  const { mutate: createTask, isPending } = useCreateTaskMutation();

  const handleSave = () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    createTask(
      {
        title: values.title,
        groupId: values.groupId,
        teacherId: user.id,
        dueDate: values.dueDate,
        description: values.description || null,
        attachments: values.attachments,
      },
      {
        onSuccess: () => {
          addToast({ title: tToasts('createSuccess'), color: 'success' });
          router.push('/tasks');
        },
        onError: () => {
          addToast({ title: tToasts('createError'), color: 'danger' });
        },
      }
    );
  };

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/tasks" pageTitle={t('newTitle')} />
      <FeatureFlagRoleGate
        flag="admin_options_tasks"
        allowedRoles={[USER_ROLES.TEACHER as UserRoles, USER_ROLES.ADMIN as UserRoles]}
      >
        <div className="overflow-y-auto px-1 pb-20 min-w-0">
          <TaskForm ref={formRef} />
        </div>
        <AdminActionButton variant="save" namespace="TasksPage" onPress={handleSave} isLoading={isPending} />
      </FeatureFlagRoleGate>
    </section>
  );
}
