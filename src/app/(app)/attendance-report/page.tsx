import { AttendanceReport } from '@/components/attendance/report/AttendanceReport';
import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import NavigationBar from '@/components/common/NavigationBar';
import { USER_ROLES } from '@/lib/const';
import type { UserRoles } from '@/types/common.types';
import { getTranslations } from 'next-intl/server';

export default async function AttendanceReportPage() {
  const t = await getTranslations('AttendanceReport');
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/feed" pageTitle={t('title')} />
      <FeatureFlagRoleGate
        flag="admin_options_attendance_report"
        allowedRoles={[USER_ROLES.TEACHER as UserRoles, USER_ROLES.ADMIN as UserRoles]}
      >
        <AttendanceReport />
      </FeatureFlagRoleGate>
    </section>
  );
}
