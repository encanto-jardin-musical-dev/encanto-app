import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import { USER_ROLES } from '@/lib/const';
import type { UserRoles } from '@/types/common.types';
import { AdminAttendanceOverview } from '@/components/admin/attendance/AdminAttendanceOverview';
import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function AdminAttendancePage() {
  const t = await getTranslations('AdminAttendance');
  const pageTitle = t('title');

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <FeatureFlagRoleGate flag="admin_options_attendance" allowedRoles={[USER_ROLES.ADMIN as UserRoles]}>
        <NavigationBar backRoute="/admin" pageTitle={pageTitle} />
        <AdminAttendanceOverview />
      </FeatureFlagRoleGate>
    </section>
  );
}