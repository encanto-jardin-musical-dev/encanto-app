'use client';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminSearchBar } from '@/components/common/AdminSearchBar';
import useStaffTasksQuery from '@/hooks/UseStaffTasksQuery';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import { normalizeSearchText } from '@/utils/text';
import { Skeleton } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TaskListItem } from './TaskListItem';

const SKELETON_COUNT = 4;

function TaskListSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </>
  );
}

export function TaskList() {
  const t = useTranslations('TasksPage.list');
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const isAdmin = user.role === USER_ROLES.ADMIN;

  const [search, setSearch] = useState('');

  const teacherId = isAdmin ? undefined : user.id;
  const { data: tasks, isPending } = useStaffTasksQuery(user.id, teacherId);

  const filteredTasks = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return tasks ?? [];
    return (tasks ?? []).filter((task) => normalizeSearchText(task.title).includes(query));
  }, [tasks, search]);

  return (
    <div className="grid grid-rows-[auto_1fr] gap-3 min-h-0 overflow-hidden">
      <AdminSearchBar onSearch={setSearch} placeholder={t('searchPlaceholder')} />
      <div className="flex flex-col gap-3 overflow-y-auto min-h-0 pb-20">
        {isPending ? (
          <TaskListSkeleton />
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-default-500 py-8">{t('empty')}</p>
        ) : (
          filteredTasks.map((task) => <TaskListItem key={task.id} task={task} />)
        )}
      </div>
      <AdminActionButton
        variant="add"
        namespace="TasksPage"
        onPress={() => router.push('/tasks/new')}
      />
    </div>
  );
}
