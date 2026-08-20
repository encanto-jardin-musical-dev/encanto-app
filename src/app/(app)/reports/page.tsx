import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import { USER_ROLES } from '@/lib/const';
import type { UserRoles } from '@/types/common.types';
import { ReportList } from '@/components/reports/ReportList';
import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function ReportsPage() {
  const t = await getTranslations('ReportsPage.list');
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/feed" pageTitle={t('title')} />
      <FeatureFlagRoleGate
        flag="admin_options_reports"
        allowedRoles={[USER_ROLES.TEACHER as UserRoles, USER_ROLES.ADMIN as UserRoles]}
      >
        <ReportList />
      </FeatureFlagRoleGate>
    </section>
  );
}
