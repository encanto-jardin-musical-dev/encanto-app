"use client";

import UseGetMessagesQuery, {
  getMessagesQueryKey,
} from "@/hooks/UseGetMessagesQuery";
import { UseSupabaseRealtime } from "@/hooks/UseSupabaseRealtime";
import { userIdAtom } from "@/lib/store/user";
import type { Message, MessagePage } from "@/types/messages.types";
import { Spinner } from "@heroui/react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MessageCard from "./MessageCard";
import NewMessagePill from "./NewMessagePill";

type MessagesListProps = {
  senderID: string;
};

const BOTTOM_THRESHOLD_PX = 100;

type MessagesInfiniteData = InfiniteData<MessagePage, string | null>;

function buildMessageFromRealtime(raw: Record<string, unknown>): Message {
  return {
    message_id: raw.id as string,
    message_content: (raw.content as string) ?? null,
    sender_id: (raw.sender_id as string) ?? null,
    receiver_id: (raw.receiver_id as string) ?? null,
    message_created_at: (raw.created_at as string) ?? null,
    is_read: (raw.is_read as boolean | null) ?? null,
    read_at: (raw.read_at as string | null) ?? null,
    message_attachments: (raw.attachments as Message["message_attachments"]) ?? null,
    group_id: (raw.group_id as string | null) ?? null,
    sender_first_name: null,
    sender_last_name: null,
    sender_role: null,
    receiver_first_name: null,
    receiver_last_name: null,
    receiver_role: null,
  };
}

export default function MessagesList({ senderID }: MessagesListProps) {
  const [userID] = useAtom(userIdAtom);
  const queryClient = useQueryClient();
  const t = useTranslations("MessagesList");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);

  const isAtBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const isPrependingRef = useRef(false);
  const savedDistanceFromBottomRef = useRef<number | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);

  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    data,
  } = UseGetMessagesQuery({
    currentUserId: userID ?? "",
    threadId: senderID,
    kind: "direct",
    enabled: !!userID && !!senderID,
  });

  const queryKey = useMemo(
    () => getMessagesQueryKey(userID ?? "", senderID),
    [userID, senderID]
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
  }, []);

  // Track scroll position for "at bottom" detection and pill dismissal.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = isNearBottom();
      isAtBottomRef.current = atBottom;
      if (atBottom && unreadCount > 0) setUnreadCount(0);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isNearBottom, unreadCount]);

  // Initial scroll to bottom once first page arrives.
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      scrollToBottom();
      isAtBottomRef.current = true;
      didInitialScrollRef.current = true;
    });
  }, [messages.length, scrollToBottom]);

  // Scroll anchoring when older pages prepend.
  const pagesLength = data?.pages.length ?? 0;
  useLayoutEffect(() => {
    if (!isPrependingRef.current) return;
    const el = scrollRef.current;
    const saved = savedDistanceFromBottomRef.current;
    if (el && saved != null) {
      el.scrollTop = el.scrollHeight - saved;
    }
    isPrependingRef.current = false;
    savedDistanceFromBottomRef.current = null;
  }, [pagesLength]);

  // IntersectionObserver on top sentinel to fetch older pages.
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isFetchingNextPage) return;
        if (!didInitialScrollRef.current) return; // avoid firing during initial load
        const el = scrollRef.current;
        if (el) {
          savedDistanceFromBottomRef.current = el.scrollHeight - el.scrollTop;
          isPrependingRef.current = true;
        }
        fetchNextPage();
      },
      { root, rootMargin: "200px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Realtime: incoming messages addressed TO current user.
  const { data: incomingMessage, status: incomingStatus } = UseSupabaseRealtime({
    channelName: `incoming-messages-${userID}`,
    schema: "public",
    table: "messages",
    event: "INSERT",
    filter: `receiver_id=eq.${userID}`,
  });

  // Realtime: outgoing messages sent FROM current user (echoes optimistic send).
  const { data: outgoingMessage, status: outgoingStatus } = UseSupabaseRealtime({
    channelName: `outgoing-messages-${userID}`,
    schema: "public",
    table: "messages",
    event: "INSERT",
    filter: `sender_id=eq.${userID}`,
  });

  // Realtime: read-status updates.
  const { data: updatedMessage } = UseSupabaseRealtime({
    channelName: `message-updates-${userID}`,
    schema: "public",
    table: "messages",
    event: "UPDATE",
    filter: `receiver_id=eq.${userID}`,
  });

  const appendToCache = useCallback(
    (msg: Message) => {
      queryClient.setQueryData<MessagesInfiniteData>(queryKey, (prev) => {
        if (!prev) {
          return {
            pages: [[msg]],
            pageParams: [null],
          };
        }
        const firstPage = prev.pages[0] ?? [];
        if (firstPage.some((m) => m.message_id === msg.message_id)) {
          return prev;
        }
        const newFirst = [msg, ...firstPage];
        return {
          ...prev,
          pages: [newFirst, ...prev.pages.slice(1)],
        };
      });
    },
    [queryClient, queryKey]
  );

  const patchMessageInCache = useCallback(
    (messageId: string, patch: Partial<Message>) => {
      queryClient.setQueryData<MessagesInfiniteData>(queryKey, (prev) => {
        if (!prev) return prev;
        let changed = false;
        const pages = prev.pages.map((page) => {
          if (!page.some((m) => m.message_id === messageId)) return page;
          changed = true;
          return page.map((m) =>
            m.message_id === messageId ? { ...m, ...patch } : m
          );
        });
        if (!changed) return prev;
        return { ...prev, pages };
      });
    },
    [queryClient, queryKey]
  );

  // Handle incoming realtime messages.
  useEffect(() => {
    if (incomingStatus !== "connected" || !incomingMessage) return;
    const raw = incomingMessage as unknown as Record<string, unknown>;
    const isRelevant =
      raw.sender_id === senderID && raw.receiver_id === userID;
    if (!isRelevant) return;

    const processed = buildMessageFromRealtime(raw);
    appendToCache(processed);

    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
        setUnreadCount(0);
      });
    } else {
      setUnreadCount((c) => c + 1);
    }
  }, [incomingMessage, incomingStatus, senderID, userID, appendToCache, scrollToBottom]);

  // Handle outgoing realtime echoes.
  useEffect(() => {
    if (outgoingStatus !== "connected" || !outgoingMessage) return;
    const raw = outgoingMessage as unknown as Record<string, unknown>;
    const isRelevant =
      raw.sender_id === userID && raw.receiver_id === senderID;
    if (!isRelevant) return;

    const processed = buildMessageFromRealtime(raw);
    appendToCache(processed);

    requestAnimationFrame(() => {
      scrollToBottom("smooth");
      setUnreadCount(0);
    });
    isAtBottomRef.current = true;
  }, [outgoingMessage, outgoingStatus, senderID, userID, appendToCache, scrollToBottom]);

  // Handle read-status updates.
  useEffect(() => {
    if (!updatedMessage) return;
    const raw = updatedMessage as unknown as Record<string, unknown>;
    const isRelevant =
      (raw.sender_id === senderID && raw.receiver_id === userID) ||
      (raw.sender_id === userID && raw.receiver_id === senderID);
    if (!isRelevant) return;
    if (!raw.id) return;
    patchMessageInCache(raw.id as string, {
      is_read: (raw.is_read as boolean | null) ?? null,
      read_at: (raw.read_at as string | null) ?? null,
    });
  }, [updatedMessage, senderID, userID, patchMessageInCache]);

  const handlePillClick = useCallback(() => {
    scrollToBottom("smooth");
    setUnreadCount(0);
    isAtBottomRef.current = true;
  }, [scrollToBottom]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-default-500 text-sm">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-0">
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto"
      >
        <div className="min-h-full flex flex-col justify-end gap-4">
          <div ref={topSentinelRef} />
          {isFetchingNextPage ? (
            <div className="flex justify-center py-2">
              <Spinner size="sm" />
            </div>
          ) : null}
          {messages.map((message) => (
            <MessageCard
              key={message.message_id}
              message={message}
              isOwnMessage={message.sender_id === userID}
            />
          ))}
        </div>
      </div>
      <NewMessagePill count={unreadCount} onPress={handlePillClick} />
    </div>
  );
}
