"use client";
import { useAdminAttendanceOverviewQuery } from '@/hooks/UseAdminAttendanceOverviewQuery';
import { useTranslations } from 'next-intl';
import { AdminAttendanceGroupSection } from './AdminAttendanceGroupSection';
import { AdminCheckoutModal } from './AdminCheckoutModal';
import { useState } from 'react';

export type CheckoutChild = {
  id: string;
  name: string;
  checkInTime: string;
};

export function AdminAttendanceOverview() {
  const t = useTranslations('AdminAttendance');
  const { data: overview, isLoading, error } = useAdminAttendanceOverviewQuery();
  const [checkoutChild, setCheckoutChild] = useState<CheckoutChild | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-default-500">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-danger">{t('error')}</span>
      </div>
    );
  }

  if (!overview || overview.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-default-500">{t('noChildrenPresent')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 h-full overflow-auto">
        <h2 className="text-lg font-semibold">{t('subtitle')}</h2>
        {overview.map((group) => (
          <AdminAttendanceGroupSection
            key={group.groupId}
            group={group}
            onChildClick={(id, name, checkInTime) => 
              setCheckoutChild({ id, name, checkInTime })
            }
          />
        ))}
      </div>

      <AdminCheckoutModal
        child={checkoutChild}
        onClose={() => setCheckoutChild(null)}
      />
    </>
  );
}