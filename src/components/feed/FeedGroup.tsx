'use client';

import { contextGroupValue } from '@/lib/store/common';
import { feedFilterAtom, groupMessagesAtom, groupTasksAtom } from '@/lib/store/feed';
import { DetailedMessage, Attachment } from '@/types/messages.types';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MessageFeedCard from './MessageFeedCard';
import TaskFeedCard from './TaskFeedCard';
import { ActionButton } from '../common/ActionButton';
import { userAtom } from '@/lib/store/user';
import EmptyFeed from './EmptyFeed';
import useGetUserFeedMessages from '@/hooks/UseGetUserFeedMessages';
import useGroupTasksQuery from '@/hooks/UseGroupTasksQuery';
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
  const feedFilter = useAtomValue(feedFilterAtom);
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);

  const { id } = user;

  const tasksEnabled = useFeatureFlagEnabled('admin_options_tasks') === true;

  const {
    data: feedMeessages,
    refetch: refetchMessages,
    isLoading,
    isPending,
  } = useGetUserFeedMessages({
    params: { userID: id, groupID: groupContextId as string },
    options: { enabled: id !== '' && groupContextId !== '' },
  });

  const { data: feedTasks } = useGroupTasksQuery(
    groupContextId as string,
    tasksEnabled && groupContextId !== ''
  );

  const { data, status } = UseSupabaseRealtime({
    channelName: 'feed-messages-channel',
    schema: 'public',
    table: 'messages',
    event: 'INSERT',
  });

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

  useEffect(() => {
    if (groupContextId) {
      refetchMessages();
    }
  }, [groupContextId, refetchMessages]);

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
    if (status === 'connected' && data) {
      // Check if message is relevant to current user/group context
      const isRelevant = data.receiver_id === id && 
        (data.group_id === groupContextId || data.group_id === null);
      
      if (isRelevant && data.sender_id && data.receiver_id) {
        // Set user IDs to fetch profiles for
        setPendingUserIds([data.sender_id, data.receiver_id]);
      }
    }
  }, [data, status, id, groupContextId]);

  // Separate effect to handle profile data and message transformation
  useEffect(() => {
    if (data && userProfiles.length > 0 && pendingUserIds.length > 0) {
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
      
      // Clear pending user IDs
      setPendingUserIds([]);
    }
  }, [data, userProfiles, pendingUserIds, transformMessageToDetailed, setGroupMessages]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(groupMessages)) return [];
    return filterMostRecentMessagesBySender(groupMessages);
  }, [filterMostRecentMessagesBySender, groupMessages]);

  const feedItems = useMemo(
    () => mergeFeedItems(filteredMessages, groupTasks, feedFilter),
    [filteredMessages, groupTasks, feedFilter]
  );

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-24">
      {isLoading && <Spinner />}
      {feedItems.length === 0 && !isLoading && !isPending ? (
        <EmptyFeed />
      ) : null}
      {feedItems.length > 0 && !isLoading
        ? feedItems.map(item =>
            item.type === 'message' ? (
              <MessageFeedCard key={item.data.message_id} message={item.data} />
            ) : (
              <TaskFeedCard key={item.data.id} task={item.data} />
            )
          )
        : null}
      <ActionButton />
    </div>
  );
}
