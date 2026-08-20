import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import { USER_ROLES } from '@/lib/const';
import type { UserRoles } from '@/types/common.types';
import { TaskList } from '@/components/tasks/TaskList';
import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function TasksPage() {
  const t = await getTranslations('TasksPage.list');
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/feed" pageTitle={t('title')} />
      <FeatureFlagRoleGate
        flag="admin_options_tasks"
        allowedRoles={[USER_ROLES.TEACHER as UserRoles, USER_ROLES.ADMIN as UserRoles]}
      >
        <TaskList />
      </FeatureFlagRoleGate>
    </section>
  );
}
