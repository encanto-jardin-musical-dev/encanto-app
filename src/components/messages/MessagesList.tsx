"use client";

import { messagesAtom } from "@/lib/store/messages";
import { Message } from "@/types/messages.types";
import { useAtom } from "jotai";
import { useEffect, useRef, useCallback } from "react";
import MessageCard from "./MessageCard";
import { userIdAtom } from "@/lib/store/user";
import UseGetMessagesQuery from "@/hooks/UseGetMessagesQuery";
import { UseSupabaseRealtime } from "@/hooks/UseSupabaseRealtime";
import { Spinner } from "@heroui/react";

type MessagesListProps = {
  senderID: string;
};



export default function MessagesList({ senderID }: MessagesListProps) {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [userID] = useAtom(userIdAtom);

  const messageListRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, []);

  // Listen for messages sent TO current user (incoming messages)
  const { data: incomingMessage, status: incomingStatus } = UseSupabaseRealtime({
    channelName: `incoming-messages-${userID}`,
    schema: 'public',
    table: 'messages',
    event: 'INSERT',
    filter: `receiver_id=eq.${userID}`
  });

  // Listen for messages sent FROM current user (outgoing messages)
  const { data: outgoingMessage, status: outgoingStatus } = UseSupabaseRealtime({
    channelName: `outgoing-messages-${userID}`,
    schema: 'public',
    table: 'messages',
    event: 'INSERT',
    filter: `sender_id=eq.${userID}`
  });

  // Listen for UPDATE events to capture read status changes
  const { data: updatedMessage } = UseSupabaseRealtime({
    channelName: `message-updates-${userID}`,
    schema: 'public',
    table: 'messages',
    event: 'UPDATE',
    filter: `receiver_id=eq.${userID}`
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle incoming messages (sent TO current user)
  useEffect(() => {
    if (incomingStatus === 'connected' && incomingMessage) {
      // Only process if this conversation is relevant (between current user and sender)
      const isRelevantConversation = 
        (incomingMessage.sender_id === senderID && incomingMessage.receiver_id === userID);
      
      if (isRelevantConversation) {
        const processedMessage: Message = {
          message_id: incomingMessage.id,
          message_content: incomingMessage.content,
          sender_id: incomingMessage.sender_id,
          receiver_id: incomingMessage.receiver_id,
          message_created_at: incomingMessage.created_at,
          is_read: incomingMessage.is_read,
          read_at: incomingMessage.read_at,
          message_attachments: incomingMessage.attachments,
          group_id: incomingMessage.group_id
        } as Message;
        
        setMessages(prev => [...prev, processedMessage]);
        scrollToBottom();
      }
    }
  }, [incomingMessage, incomingStatus, senderID, userID, setMessages, scrollToBottom]);

  // Handle outgoing messages (sent FROM current user)
  useEffect(() => {
    if (outgoingStatus === 'connected' && outgoingMessage) {
      // Only process if this conversation is relevant (from current user to sender)
      const isRelevantConversation = 
        (outgoingMessage.sender_id === userID && outgoingMessage.receiver_id === senderID);
      
      if (isRelevantConversation) {
        const processedMessage: Message = {
          message_id: outgoingMessage.id,
          message_content: outgoingMessage.content,
          sender_id: outgoingMessage.sender_id,
          receiver_id: outgoingMessage.receiver_id,
          message_created_at: outgoingMessage.created_at,
          is_read: outgoingMessage.is_read,
          read_at: outgoingMessage.read_at,
          message_attachments: outgoingMessage.attachments,
          group_id: outgoingMessage.group_id
        } as Message;
        
        setMessages(prev => [...prev, processedMessage]);
        scrollToBottom();
      }
    }
  }, [outgoingMessage, outgoingStatus, senderID, userID, setMessages, scrollToBottom]);

  // Handle read status updates
  useEffect(() => {
    if (updatedMessage && updatedMessage.is_read) {
      // Only update if this is part of the current conversation
      const isRelevantConversation = 
        (updatedMessage.sender_id === senderID && updatedMessage.receiver_id === userID) ||
        (updatedMessage.sender_id === userID && updatedMessage.receiver_id === senderID);
        
      if (isRelevantConversation) {
        setMessages(prev => 
          prev.map(msg => 
            msg.message_id === updatedMessage.id
              ? { ...msg, is_read: updatedMessage.is_read, read_at: updatedMessage.read_at }
              : msg
          )
        );
      }
    }
  }, [updatedMessage, senderID, userID, setMessages]);

  const { data: responseMessages, isLoading: isLoadingMessages } = UseGetMessagesQuery({ 
    params: { userID: senderID },
    options: { enabled: !!senderID }
  });

  // Handle initial message loading from query
  useEffect(() => {
    if (responseMessages) {
      setMessages(responseMessages);
    }
  }, [responseMessages, setMessages]);


  return (
    <div
      className="w-full flex flex-col gap-4 overflow-auto scroll-smooth"
      ref={messageListRef}
    >
      {isLoadingMessages && (<Spinner />)}
      {Array.isArray(messages)
        ? messages.map((message) => (
          <MessageCard
            key={message.message_id}
            message={message}
            isOwnMessage={message.sender_id === userID}
          />
        ))
        : []}
    </div>
  );
}
