import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import { USER_ROLES } from '@/lib/const';
import type { UserRoles } from '@/types/common.types';
import { AdminCleanupFlow } from '@/components/admin/cleanup/AdminCleanupFlow';
import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function AdminCleanupPage() {
  const t = await getTranslations('AdminCleanup');
  const pageTitle = t('title');

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <FeatureFlagRoleGate flag="admin_cleanup" allowedRoles={[USER_ROLES.ADMIN as UserRoles]}>
        <NavigationBar backRoute="/admin" pageTitle={pageTitle} />
        <AdminCleanupFlow />
      </FeatureFlagRoleGate>
    </section>
  );
}
