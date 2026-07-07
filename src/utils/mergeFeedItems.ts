import type { FeedFilter } from '@/lib/store/feed';
import type { Database } from '@/types/database.types';
import type { DetailedMessage } from '@/types/messages.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export type FeedItem =
  | { type: 'message'; createdAt: string; data: DetailedMessage }
  | { type: 'task'; createdAt: string; data: Task };

/** Merges messages and tasks into a single list ordered by creation date descending, filtered by the active feed filter. */
export function mergeFeedItems(
  messages: DetailedMessage[],
  tasks: Task[],
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

  const items =
    filter === 'messages' ? messageItems : filter === 'tasks' ? taskItems : [...messageItems, ...taskItems];

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
