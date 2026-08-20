'use client';

import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import NavigationBar from '@/components/common/NavigationBar';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { USER_ROLES } from '@/lib/const';
import { userRoleAtom } from '@/lib/store/user';
import type { UserRoles } from '@/types/common.types';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TaskDetailPage() {
  const t = useTranslations('TasksPage.list');
  const { taskId } = useParams<{ groupId: string; taskId: string }>();
  const role = useAtomValue(userRoleAtom);
  const backRoute = role === USER_ROLES.PARENT ? '/feed' : '/tasks';

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute={backRoute} pageTitle={t('title')} />
      <FeatureFlagRoleGate
        flag="admin_options_tasks"
        allowedRoles={[
          USER_ROLES.PARENT as UserRoles,
          USER_ROLES.TEACHER as UserRoles,
          USER_ROLES.ADMIN as UserRoles,
        ]}
      >
        <div className="overflow-y-auto min-w-0">
          <TaskDetail taskId={taskId} />
        </div>
      </FeatureFlagRoleGate>
    </section>
  );
}
