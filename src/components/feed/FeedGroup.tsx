'use client';

import { contextGroupValue } from '@/lib/store/common';
import { groupMessagesAtom } from '@/lib/store/feed';
import { DetailedMessage } from '@/types/messages.types';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MessageFeedCard from './MessageFeedCard';
import { ActionButton } from '../common/ActionButton';
import { userAtom } from '@/lib/store/user';
import EmptyFeed from './EmptyFeed';
import useGetUserFeedMessages from '@/hooks/UseGetUserFeedMessages';
import { Spinner } from '@heroui/react';
import { UseSupabaseRealtime } from '@/hooks/UseSupabaseRealtime';
import UseGetUserProfilesQuery from '@/hooks/UseGetUserProfilesQuery';
import type { Database } from '@/types/database.types';

export default function FeedGroup() {
  const [user] = useAtom(userAtom);
  const [groupContextId] = useAtom(contextGroupValue);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);

  const { id } = user;

  const {
    data: feedMeessages,
    refetch: refetchMessages,
    isLoading,
    isPending,
  } = useGetUserFeedMessages({
    params: { userID: id, groupID: groupContextId as string },
    options: { enabled: id !== '' && groupContextId !== '' },
  });

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
      message_attachments: rawMessage.attachments ? [rawMessage.attachments as string] : [],
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

  return (
    <div className="w-full flex flex-col gap-4 h-full">
      {isLoading && <Spinner />}
      {filteredMessages.length === 0 && !isLoading && !isPending ? (
        <EmptyFeed />
      ) : null}
      {filteredMessages.length > 0 && !isLoading
        ? filteredMessages.map(message => (
            <MessageFeedCard key={message.message_id} message={message} />
          ))
        : null}
      <ActionButton />
    </div>
  );
}
