'use client';

import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import NavigationBar from '@/components/common/NavigationBar';
import { ReportDetail } from '@/components/reports/ReportDetail';
import { USER_ROLES } from '@/lib/const';
import { userRoleAtom } from '@/lib/store/user';
import type { UserRoles } from '@/types/common.types';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ReportDetailPage() {
  const t = useTranslations('ReportsPage.list');
  const { reportId } = useParams<{ groupId: string; reportId: string }>();
  const role = useAtomValue(userRoleAtom);
  const backRoute = role === USER_ROLES.PARENT ? '/feed' : '/reports';

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute={backRoute} pageTitle={t('title')} />
      <FeatureFlagRoleGate
        flag="admin_options_reports"
        allowedRoles={[
          USER_ROLES.PARENT as UserRoles,
          USER_ROLES.TEACHER as UserRoles,
          USER_ROLES.ADMIN as UserRoles,
        ]}
      >
        <div className="overflow-y-auto min-w-0">
          <ReportDetail reportId={reportId} />
        </div>
      </FeatureFlagRoleGate>
    </section>
  );
}
