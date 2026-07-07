'use client';

import type { Database } from '@/types/database.types';
import { CalendarIcon, ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

type Task = Database['public']['Tables']['tasks']['Row'];

type TaskFeedCardProps = {
  task: Task;
};

const DESCRIPTION_SNIPPET_LENGTH = 120;

export default function TaskFeedCard({ task }: TaskFeedCardProps) {
  const t = useTranslations('UserFeedPage.TaskFeedCard');
  const format = useFormatter();
  const now = useNow();
  const router = useRouter();

  const createdDate = new Date(task.created_at as string);
  const snippet = task.description
    ? task.description.length > DESCRIPTION_SNIPPET_LENGTH
      ? `${task.description.slice(0, DESCRIPTION_SNIPPET_LENGTH)}…`
      : task.description
    : null;

  const handleSeeMore = () => {
    router.push(`/tasks/${task.group_id}/${task.id}`);
  };

  return (
    <Card className="bg-primary-100">
      <CardHeader className="gap-2 items-start">
        <div>
          <ClipboardDocumentListIcon className="w-6 h-6 text-primary-600" />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-medium font-semibold text-primary-700">{task.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-tiny text-primary-600">
          <ClockIcon className="w-4 h-4" />
          <span>{format.relativeTime(createdDate, now)}</span>
        </div>
      </CardHeader>
      <CardBody className="gap-2">
        {snippet && <p className="text-small text-default-700">{snippet}</p>}
        {task.due_date && (
          <div className="flex items-center gap-1 text-small text-default-500">
            <CalendarIcon className="w-4 h-4" />
            <span>{t('dueDate', { date: format.dateTime(new Date(task.due_date), { year: 'numeric', month: 'short', day: 'numeric' }) })}</span>
          </div>
        )}
        <Button size="sm" variant="light" color="primary" className="self-end" onPress={handleSeeMore}>
          {t('seeMore')}
        </Button>
      </CardBody>
    </Card>
  );
}
