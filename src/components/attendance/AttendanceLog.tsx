'use client';
import { AdminSearchBar } from '@/components/common/AdminSearchBar';
import useClockInMutation from '@/hooks/UseClockInMutation';
import useClockOutMutation from '@/hooks/UseClockOutMutation';
import useGroupAttendanceQuery from '@/hooks/UseGroupAttendanceQuery';
import { normalizeSearchText } from '@/utils/text';
import { addToast, Button, Radio, RadioGroup, Skeleton } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { AttendanceChildCard } from './AttendanceChildCard';

type AttendanceMode = 'clock-in' | 'clock-out';

type AttendanceLogProps = {
  groupId: string;
};

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1 w-20">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function AttendanceLog({ groupId }: AttendanceLogProps) {
  const t = useTranslations('Attendance.log');
  const { data, isPending } = useGroupAttendanceQuery(groupId);
  const clockInMutation = useClockInMutation(groupId);
  const clockOutMutation = useClockOutMutation(groupId);

  const [mode, setMode] = useState<AttendanceMode>('clock-in');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const children = useMemo(() => data ?? [], [data]);
  const presentCount = children.filter(c => c.check_in && !c.check_out).length;
  const totalCount = children.length;

  const activeList = useMemo(() => {
    return mode === 'clock-in'
      ? children.filter(c => !c.check_in || c.check_out)
      : children.filter(c => c.check_in && !c.check_out);
  }, [children, mode]);

  const filteredList = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return activeList;
    return activeList.filter(c =>
      normalizeSearchText(`${c.first_name} ${c.last_name}`).includes(query)
    );
  }, [activeList, search]);

  const handleModeChange = (value: string) => {
    setMode(value as AttendanceMode);
    setSelectedIds(new Set());
  };

  const toggleChild = (childId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(childId)) {
        next.delete(childId);
      } else {
        next.add(childId);
      }
      return next;
    });
  };

  const isSaving = clockInMutation.isPending || clockOutMutation.isPending;

  const handleSave = async () => {
    const childIds = [...selectedIds];
    if (childIds.length === 0) return;

    try {
      if (mode === 'clock-in') {
        await clockInMutation.mutateAsync(childIds);
      } else {
        await clockOutMutation.mutateAsync(childIds);
      }
      setSelectedIds(new Set());
    } catch {
      addToast({ title: t('saveError'), color: 'danger' });
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full gap-4 overflow-hidden">
      <div className="flex flex-col gap-3">
        <AdminSearchBar
          onSearch={setSearch}
          placeholder={t('searchPlaceholder')}
        />
        <div className="flex items-center justify-between gap-3">
          <RadioGroup
            aria-label={t('modeLabel')}
            orientation="horizontal"
            value={mode}
            onValueChange={handleModeChange}
          >
            <Radio value="clock-in">{t('modes.clockIn')}</Radio>
            <Radio value="clock-out">{t('modes.clockOut')}</Radio>
          </RadioGroup>
          <span className="text-small text-default-500 shrink-0">
            {t('counter', { present: presentCount, total: totalCount })}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto">
        {isPending ? (
          <GridSkeleton />
        ) : filteredList.length === 0 ? (
          <p className="text-center text-default-500 py-4">
            {mode === 'clock-in' ? t('emptyClockIn') : t('emptyClockOut')}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 py-8 justify-items-center">
            {filteredList.map(child => (
              <AttendanceChildCard
                key={child.id}
                imageUrl={child.avatar_url}
                name={`${child.first_name} ${child.last_name}`}
                selected={selectedIds.has(child.id)}
                onToggle={() => toggleChild(child.id)}
                overlay={
                  mode === 'clock-in' && child.check_out ? (
                    <span className="absolute -bottom-1 -right-1 bg-success text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {t('checkedOutBadge')}
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <Button
        color="primary"
        fullWidth
        isDisabled={selectedIds.size === 0}
        isLoading={isSaving}
        onPress={handleSave}
      >
        {t('save')}
      </Button>
    </div>
  );
}
