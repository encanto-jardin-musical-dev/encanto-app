"use client";
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { EntityAvatarChip } from '@/components/common/EntityAvatarChip';
import { useTranslations } from 'next-intl';
import { formatTime } from '@/utils/formatTime';
import type { AdminAttendanceOverviewRow } from '@/queries/attendance/get-admin-attendance-overview';

type AdminAttendanceGroupSectionProps = {
  group: AdminAttendanceOverviewRow;
  onChildClick: (childId: string, childName: string, checkInTime: string) => void;
};

export function AdminAttendanceGroupSection({ group, onChildClick }: AdminAttendanceGroupSectionProps) {
  const t = useTranslations('AdminAttendance');



  return (
    <div className="border rounded-lg p-4 bg-content1/50">
      <h3 className="text-medium font-semibold mb-3 text-default-700">
        {group.groupName}
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {group.children.map((child) => (
          <button
            key={child.id}
            onClick={() => onChildClick(
              child.id,
              `${child.first_name} ${child.last_name}`,
              child.check_in!
            )}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-default-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${t('clickToCheckout')} ${child.first_name} ${child.last_name}`}
          >
            <EntityAvatarChip
              imageUrl={child.avatar_url}
              fallbackIcon={FaceSmileIcon}
              fallbackIconClassName="w-8 h-8 text-default-400"
              size="w-16 h-16"
              label={child.first_name}
              labelClassName="text-xs"
              chipWidth="w-20"
            />
            {child.check_in && (
              <span className="text-xs text-default-500">
                {formatTime(child.check_in)}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {group.children.length === 0 && (
        <p className="text-small text-default-500 italic">
          {t('noChildrenInGroup')}
        </p>
      )}
    </div>
  );
}