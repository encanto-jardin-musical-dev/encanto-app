import type { FeedFilter } from '@/lib/store/feed';
import type { Database } from '@/types/database.types';
import type { DetailedMessage } from '@/types/messages.types';
import type { ReportRow } from '@/queries/reports/get-group-reports';

type Task = Database['public']['Tables']['tasks']['Row'];
type Report = ReportRow;

export type FeedItem =
  | { type: 'message'; createdAt: string; data: DetailedMessage }
  | { type: 'task'; createdAt: string; data: Task }
  | { type: 'report'; createdAt: string; data: Report };

/** Merges messages, tasks, and reports into a single list ordered by creation date descending, filtered by the active feed filter. */
export function mergeFeedItems(
  messages: DetailedMessage[],
  tasks: Task[],
  reports: Report[],
  filter: FeedFilter
): FeedItem[] {
  const messageItems: FeedItem[] = messages.map((data) => ({
    type: 'message',
    createdAt: data.message_created_at,
    data,
  }));
  const taskItems: FeedItem[] = tasks.map((data) => ({
    type: 'task',
    createdAt: data.created_at ?? '',
    data,
  }));
  const reportItems: FeedItem[] = reports.map((data) => ({
    type: 'report',
    createdAt: data.created_at ?? '',
    data,
  }));

  const items =
    filter === 'messages'
      ? messageItems
      : filter === 'tasks'
        ? taskItems
        : filter === 'reports'
          ? reportItems
          : [...messageItems, ...taskItems, ...reportItems];

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
