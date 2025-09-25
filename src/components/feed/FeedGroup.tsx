'use client';

import { contextGroupValue } from '@/lib/store/common';
import { groupMessagesAtom } from '@/lib/store/feed';
import { DetailedMessage } from '@/types/messages.types';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import MessageFeedCard from './MessageFeedCard';
import { ActionButton } from '../common/ActionButton';
import { userAtom } from '@/lib/store/user';
import EmptyFeed from './EmptyFeed';
import useGetUserFeedMessages from '@/hooks/UseGetUserFeedMessages';
import { Spinner } from '@heroui/react';
import { UseSupabaseRealtime } from '@/hooks/UseSupabaseRealtime';

export default function FeedGroup() {
  const [user] = useAtom(userAtom);
  const [groupContextId] = useAtom(contextGroupValue);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);

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

  useEffect(() => {
    if (groupContextId) {
      refetchMessages();
    }
  }, [groupContextId, refetchMessages]);

  useEffect(() => {
    if (status === 'connected' && data) {
      console.log({ data });
    }
    if (feedMeessages) {
      setGroupMessages(feedMeessages as DetailedMessage[]);
    }
  }, [data, feedMeessages, setGroupMessages, status]);

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
