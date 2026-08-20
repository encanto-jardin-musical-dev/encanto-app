import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import { USER_ROLES } from '@/lib/const';
import type { UserRoles } from '@/types/common.types';
import { AttendanceGroupList } from '@/components/attendance/AttendanceGroupList';
import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function AttendancePage() {
  const t = await getTranslations('ActionButton');
  const pageTitle = t('actions.attendance');
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/feed" pageTitle={pageTitle} />
      <FeatureFlagRoleGate flag="admin_options_attendance" allowedRoles={[USER_ROLES.TEACHER as UserRoles, USER_ROLES.ADMIN as UserRoles]}>
        <AttendanceGroupList />
      </FeatureFlagRoleGate>
    </section>
  );
}
