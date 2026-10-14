'use client';

import { contextGroupValue } from '@/lib/store/common';
import { feedFilterAtom, groupMessagesAtom, groupReportsAtom, groupTasksAtom } from '@/lib/store/feed';
import { DetailedMessage, Attachment } from '@/types/messages.types';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import MessageFeedCard from './MessageFeedCard';
import TaskFeedCard from './TaskFeedCard';
import ReportFeedCard from './ReportFeedCard';
import { ActionButton } from '../common/ActionButton';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import EmptyFeed from './EmptyFeed';
import useGetUserFeedMessages from '@/hooks/UseGetUserFeedMessages';
import useGroupTasksQuery from '@/hooks/UseGroupTasksQuery';
import useGroupReportsQuery from '@/hooks/UseGroupReportsQuery';
import useUserChildrenQuery from '@/hooks/UseGetUserChildrenQuery';
import { Spinner } from '@heroui/react';
import { UseSupabaseRealtime } from '@/hooks/UseSupabaseRealtime';
import UseGetUserProfilesQuery from '@/hooks/UseGetUserProfilesQuery';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { mergeFeedItems } from '@/utils/mergeFeedItems';
import type { Database } from '@/types/database.types';

export default function FeedGroup() {
  const [user] = useAtom(userAtom);
  const [groupContextId] = useAtom(contextGroupValue);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);
  const [groupTasks, setGroupTasks] = useAtom(groupTasksAtom);
  const [groupReports, setGroupReports] = useAtom(groupReportsAtom);
  const feedFilter = useAtomValue(feedFilterAtom);

  const { id } = user;

  const tasksEnabled = useFeatureFlagEnabled('admin_options_tasks') === true;
  const reportsEnabled = useFeatureFlagEnabled('admin_options_reports') === true;
  const isParent = user.role === USER_ROLES.PARENT;

  const {
    data: feedMeessages,
    isLoading,
    isPending,
  } = useGetUserFeedMessages({
    params: { userID: id, groupID: groupContextId as string },
    options: { enabled: id !== '' && groupContextId !== '' },
  });

  const { data: feedTasks, refetch: refetchTasks } = useGroupTasksQuery(
    groupContextId as string,
    tasksEnabled && groupContextId !== ''
  );

  // Reports carry an optional single-child target; for a parent we need the
  // selected child's id (the group-context atom only stores the group id).
  const { data: contextChildren } = useUserChildrenQuery({
    params: { userID: id, groupID: groupContextId as string },
    options: { enabled: reportsEnabled && isParent && id !== '' && groupContextId !== '' },
  });

  const selectedChildId = useMemo(() => {
    if (!isParent) return undefined;
    const match = (contextChildren ?? []).find((row) => (row.children?.child_groups?.length ?? 0) > 0);
    return match?.children?.id;
  }, [contextChildren, isParent]);

  const { data: feedReports, refetch: refetchReports } = useGroupReportsQuery(
    groupContextId as string,
    isParent ? selectedChildId : undefined,
    reportsEnabled && groupContextId !== '' && (!isParent || !!selectedChildId),
    !isParent
  );

  const { data, status } = UseSupabaseRealtime({
    channelName: 'feed-messages-channel',
    schema: 'public',
    table: 'messages',
    event: 'INSERT',
  });

  const { data: newTaskRow, status: tasksRealtimeStatus } = UseSupabaseRealtime({
    channelName: 'feed-tasks-channel',
    schema: 'public',
    table: 'tasks',
    event: 'INSERT',
  });

  const { data: newReportRow, status: reportsRealtimeStatus } = UseSupabaseRealtime({
    channelName: 'feed-reports-channel',
    schema: 'public',
    table: 'daily_reports',
    event: 'INSERT',
  });

  // DELETE payloads only carry the primary key (tasks/daily_reports use the
  // default REPLICA IDENTITY), so we just drop the id from local state
  // rather than re-deriving group/child visibility from the payload.
  const { data: deletedTaskRow, status: taskDeleteStatus } = UseSupabaseRealtime({
    channelName: 'feed-tasks-delete-channel',
    schema: 'public',
    table: 'tasks',
    event: 'DELETE',
  });

  const { data: deletedReportRow, status: reportDeleteStatus } = UseSupabaseRealtime({
    channelName: 'feed-reports-delete-channel',
    schema: 'public',
    table: 'daily_reports',
    event: 'DELETE',
  });

  // Users whose profiles are needed to render the latest realtime message,
  // derived from that message (only when it is relevant to this user/group).
  const pendingUserIds = useMemo(() => {
    if (status !== 'connected' || !data) return [];
    const isRelevant = data.receiver_id === id &&
      (data.group_id === groupContextId || data.group_id === null);
    return isRelevant && data.sender_id && data.receiver_id
      ? [data.sender_id, data.receiver_id]
      : [];
  }, [data, status, id, groupContextId]);

  // The realtime message already merged into the feed, so a later profile
  // refetch doesn't apply it a second time.
  const processedMessageRef = useRef<typeof data>(null);

  const { data: userProfiles = [] } = UseGetUserProfilesQuery({
    params: { userIds: pendingUserIds },
    options: { enabled: pendingUserIds.length > 0 }
  });

  const filterMostRecentMessagesBySender = useCallback(
    (messages: DetailedMessage[]) => {
      if (!messages?.length) return [];
      const senderMap = new Map<string, DetailedMessage>();
      messages.forEach(message => {
        const current = senderMap.get(message.sender_id);
        if (
          !current ||
          message.message_created_at > current.message_created_at
        ) {
          senderMap.set(message.sender_id, message);
        }
      });

      return Array.from(senderMap.values()).sort(
        (a, b) =>
          new Date(b.message_created_at).getTime() -
          new Date(a.message_created_at).getTime()
      );
    },
    []
  );

  const transformMessageToDetailed = useCallback((
    rawMessage: Database['public']['Tables']['messages']['Row'], 
    profiles: Array<{id: string, first_name: string, last_name: string, role: string}>
  ): DetailedMessage => {
    const sender = profiles.find(p => p.id === rawMessage.sender_id);
    const receiver = profiles.find(p => p.id === rawMessage.receiver_id);
    
    return {
      message_id: rawMessage.id,
      message_content: rawMessage.content,
      message_created_at: rawMessage.created_at || '',
      sender_id: rawMessage.sender_id || '',
      sender_first_name: sender?.first_name || '',
      sender_last_name: sender?.last_name || '',
      sender_role: sender?.role || '',
      receiver_id: rawMessage.receiver_id || '',
      receiver_first_name: receiver?.first_name || '',
      receiver_last_name: receiver?.last_name || '',
      receiver_role: receiver?.role || '',
      group_id: rawMessage.group_id || undefined,
      message_attachments: Array.isArray(rawMessage.attachments) ? rawMessage.attachments as unknown as Attachment[] : null,
      is_read: rawMessage.is_read,
      read_at: rawMessage.read_at
    };
  }, []);

  // Clear the moment the group context changes: the messages query is keyed by
  // group, so until the new group's rows arrive the atom would still hold the
  // previous group's messages and the feed would render them.
  useEffect(() => {
    setGroupMessages([]);
  }, [groupContextId, setGroupMessages]);

  useEffect(() => {
    if (feedMeessages) {
      setGroupMessages(feedMeessages as DetailedMessage[]);
    }
  }, [feedMeessages, setGroupMessages]);

  useEffect(() => {
    if (!tasksEnabled) {
      setGroupTasks([]);
      return;
    }
    if (feedTasks) {
      setGroupTasks(feedTasks);
    }
  }, [feedTasks, tasksEnabled, setGroupTasks]);

  useEffect(() => {
    if (!reportsEnabled) {
      setGroupReports([]);
      return;
    }
    if (feedReports) {
      setGroupReports(feedReports);
    }
  }, [feedReports, reportsEnabled, setGroupReports]);

  useEffect(() => {
    if (
      tasksRealtimeStatus === 'connected' &&
      newTaskRow &&
      tasksEnabled &&
      groupContextId !== '' &&
      newTaskRow.group_id === groupContextId
    ) {
      refetchTasks();
    }
  }, [newTaskRow, tasksRealtimeStatus, tasksEnabled, groupContextId, refetchTasks]);

  useEffect(() => {
    if (
      reportsRealtimeStatus === 'connected' &&
      newReportRow &&
      reportsEnabled &&
      groupContextId !== '' &&
      newReportRow.group_id === groupContextId
    ) {
      const isVisible = !isParent || !newReportRow.child_id || newReportRow.child_id === selectedChildId;
      if (isVisible) refetchReports();
    }
  }, [newReportRow, reportsRealtimeStatus, reportsEnabled, groupContextId, isParent, selectedChildId, refetchReports]);

  useEffect(() => {
    if (taskDeleteStatus === 'connected' && deletedTaskRow?.id) {
      setGroupTasks((prev) => prev.filter((task) => task.id !== deletedTaskRow.id));
    }
  }, [deletedTaskRow, taskDeleteStatus, setGroupTasks]);

  useEffect(() => {
    if (reportDeleteStatus === 'connected' && deletedReportRow?.id) {
      setGroupReports((prev) => prev.filter((report) => report.id !== deletedReportRow.id));
    }
  }, [deletedReportRow, reportDeleteStatus, setGroupReports]);

  // Merge the realtime message into the feed once its profiles have loaded.
  useEffect(() => {
    if (data && userProfiles.length > 0 && pendingUserIds.length > 0 && processedMessageRef.current !== data) {
      processedMessageRef.current = data;
      const detailedMessage = transformMessageToDetailed(data, userProfiles);
      
      // Update groupMessages state
      setGroupMessages(prev => {
        if (!Array.isArray(prev)) return [detailedMessage];
        
        const existingIndex = prev.findIndex(msg => msg.sender_id === data.sender_id);
        
        if (existingIndex >= 0) {
          // Update if this message is more recent
          const existing = prev[existingIndex];
          if (data.created_at! > existing.message_created_at) {
            const updated = [...prev];
            updated[existingIndex] = detailedMessage;
            return updated;
          }
          return prev;
        } else {
          // Add new message
          return [detailedMessage, ...prev];
        }
      });
    }
  }, [data, userProfiles, pendingUserIds, transformMessageToDetailed, setGroupMessages]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(groupMessages)) return [];
    return filterMostRecentMessagesBySender(groupMessages);
  }, [filterMostRecentMessagesBySender, groupMessages]);

  const feedItems = useMemo(
    () => mergeFeedItems(filteredMessages, groupTasks, groupReports, feedFilter),
    [filteredMessages, groupTasks, groupReports, feedFilter]
  );

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-[calc(5rem+2vh)] md:pb-0">
      {isLoading && <Spinner />}
      {feedItems.length === 0 && !isLoading && !isPending ? (
        <EmptyFeed />
      ) : null}
      {feedItems.length > 0 && !isLoading
        ? feedItems.map(item =>
            item.type === 'message' ? (
              <MessageFeedCard key={item.data.message_id} message={item.data} />
            ) : item.type === 'task' ? (
              <TaskFeedCard key={item.data.id} task={item.data} />
            ) : (
              <ReportFeedCard key={item.data.id} report={item.data} />
            )
          )
        : null}
      <ActionButton />
    </div>
  );
}
