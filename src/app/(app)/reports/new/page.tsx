'use client';

import { FeatureFlagRoleGate } from '@/components/common/FeatureFlagRoleGate';
import NavigationBar from '@/components/common/NavigationBar';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { ReportForm, ReportFormRef } from '@/components/reports/ReportForm';
import useCreateReportMutation from '@/hooks/UseCreateReportMutation';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { UserRoles } from '@/types/common.types';
import { addToast } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function NewReportPage() {
  const t = useTranslations('ReportsPage.form');
  const tToasts = useTranslations('ReportsPage.toasts');
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const formRef = useRef<ReportFormRef>(null);
  const { mutate: createReport, isPending } = useCreateReportMutation();

  const handleSave = () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    createReport(
      {
        title: values.title,
        groupId: values.groupId,
        teacherId: user.id,
        childId: values.childId,
        description: values.description || null,
        attachments: values.attachments,
      },
      {
        onSuccess: () => {
          addToast({ title: tToasts('createSuccess'), color: 'success' });
          router.push('/reports');
        },
        onError: () => {
          addToast({ title: tToasts('createError'), color: 'danger' });
        },
      }
    );
  };

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/reports" pageTitle={t('newTitle')} />
      <FeatureFlagRoleGate
        flag="admin_options_reports"
        allowedRoles={[USER_ROLES.TEACHER as UserRoles, USER_ROLES.ADMIN as UserRoles]}
      >
        <div className="overflow-y-auto px-1 pb-20 md:pb-0 min-w-0">
          <ReportForm ref={formRef} />
        </div>
        <AdminActionButton variant="save" namespace="ReportsPage" onPress={handleSave} isLoading={isPending} />
      </FeatureFlagRoleGate>
    </section>
  );
}
