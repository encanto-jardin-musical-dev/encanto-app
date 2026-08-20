'use client';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminSearchBar } from '@/components/common/AdminSearchBar';
import useStaffReportsQuery from '@/hooks/UseStaffReportsQuery';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { StaffReportRow } from '@/queries/reports/get-staff-reports';
import { normalizeSearchText } from '@/utils/text';
import { Skeleton } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ReportListItem } from './ReportListItem';

const SKELETON_COUNT = 4;

function ReportListSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </>
  );
}

export function ReportList() {
  const t = useTranslations('ReportsPage.list');
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const isAdmin = user.role === USER_ROLES.ADMIN;

  const [search, setSearch] = useState('');

  const teacherId = isAdmin ? undefined : user.id;
  const { data: reports, isPending } = useStaffReportsQuery(user.id, teacherId);

  const filteredReports = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return reports ?? [];
    return (reports ?? []).filter((report) => normalizeSearchText(report.title).includes(query));
  }, [reports, search]);

  const groupedReports = useMemo(() => {
    if (!isAdmin) return null;
    const groups = new Map<string, { name: string; reports: StaffReportRow[] }>();
    for (const report of filteredReports) {
      const groupId = report.group_id ?? 'ungrouped';
      const groupName = report.groups?.name ?? t('ungroupedLabel');
      const entry = groups.get(groupId);
      if (entry) {
        entry.reports.push(report);
      } else {
        groups.set(groupId, { name: groupName, reports: [report] });
      }
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredReports, isAdmin, t]);

  return (
    <div className="grid grid-rows-[auto_1fr] gap-3 min-h-0 overflow-hidden">
      <AdminSearchBar onSearch={setSearch} placeholder={t('searchPlaceholder')} />
      <div className="flex flex-col gap-3 overflow-y-auto min-h-0 pb-20 md:pb-0">
        {isPending ? (
          <ReportListSkeleton />
        ) : filteredReports.length === 0 ? (
          <p className="text-center text-default-500 py-8">{t('empty')}</p>
        ) : groupedReports ? (
          groupedReports.map((group) => (
            <div key={group.name} className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-default-500 px-1">{group.name}</h3>
              <div className="flex flex-col gap-3">
                {group.reports.map((report) => (
                  <ReportListItem key={report.id} report={report} />
                ))}
              </div>
            </div>
          ))
        ) : (
          filteredReports.map((report) => <ReportListItem key={report.id} report={report} />)
        )}
      </div>
      <AdminActionButton
        variant="add"
        namespace="ReportsPage"
        onPress={() => router.push('/reports/new')}
      />
    </div>
  );
}
