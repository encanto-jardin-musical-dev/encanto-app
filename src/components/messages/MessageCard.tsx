"use client";

import { CheckIcon } from "@heroicons/react/16/solid";
import { Card, CardBody } from "@heroui/react";
import { useFormatter } from "next-intl";
import { useEffect, useState } from "react";

import type { Message } from "@/types/messages.types";
import type { Attachment } from "@/types/messages.types";
import useMarkMessageRead from "@/hooks/UseMarkMessageReadedMutation";
import { useAttachmentUrlsQuery } from "@/hooks/UseAttachmentUrlsQuery";
import MessageAttachments from "@/components/messages/MessageAttachments";

type MessageCardProps = {
  message: Message;
  isOwnMessage: boolean;
};

export default function MessageCard({
  message,
  isOwnMessage,
}: MessageCardProps) {
  const {
    message_id,
    message_content,
    message_created_at,
    is_read,
    message_attachments,
  } = message;
  const format = useFormatter();
  const [isRead, setIsRead] = useState(is_read);
  const createdDate = new Date(message_created_at as string);

  const { mutate: markMessageAsRead } = useMarkMessageRead();

  // 9.6 Parse attachments from jsonb — messages with null attachments render unchanged
  const attachments: Attachment[] = Array.isArray(message_attachments)
    ? (message_attachments as unknown as Attachment[])
    : [];

  // Fetch signed GET URLs for this message's attachments (read path always active)
  const attachmentRequests = attachments.map(att => ({
    messageId: message_id!,
    attachment: att,
  }));

  const {
    signedUrlMap,
    isLoading: isSigningUrls,
    isError: isSigningError,
  } = useAttachmentUrlsQuery({
    requests: attachmentRequests,
    enabled: attachments.length > 0,
  });

  // Auto-mark incoming messages as read
  useEffect(() => {
    if (!is_read && !isOwnMessage) {
      markMessageAsRead(message_id!);
    }
  }, [isOwnMessage, is_read, markMessageAsRead, message_id]);

  // Read receipts are only shown on own messages. Delay the real-time read
  // update by 3 seconds to show the "message delivered then read" progression.
  useEffect(() => {
    if (is_read && isOwnMessage && !isRead) {
      const timer = setTimeout(() => {
        setIsRead(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [is_read, isOwnMessage, isRead]);

  return (
    <div
      key={message_id}
      className={`gap-2 flex flex-col ${isOwnMessage ? "items-end" : "item-start"}`}
    >
      <Card
        key={message_id}
        className={`w-11/12 shrink-0 h-auto ${isOwnMessage ? "bg-secondary-200 justify-self-end" : "bg-default-200"}`}
        shadow="none"
      >
        <CardBody className="overflow-visible">
          {/* Text content (may be empty for attachment-only messages) */}
          {message_content ? <p>{message_content}</p> : null}

          {/* 9.5 Attachment links below the text content */}
          <MessageAttachments
            attachments={attachments}
            signedUrls={signedUrlMap}
            isLoading={isSigningUrls}
            isError={isSigningError}
          />
        </CardBody>
      </Card>
      <div className="flex">
        <span className={`text-tiny ${isOwnMessage && "justify-self-end"}`}>
          {format.dateTime(createdDate, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </span>
        {isRead && isOwnMessage ? (
          <div>
            <CheckIcon className="w-4 h-4 text-success-400" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
