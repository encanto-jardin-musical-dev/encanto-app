'use client';

import useUserChildrenQuery from '@/hooks/UseGetUserChildrenQuery';
import { USER_ROLES } from '@/lib/const';
import { contextGroupValue } from '@/lib/store/common';
import { receiverAtom } from '@/lib/store/messages';
import type { Attachment } from '@/types/messages.types';
import { DetailedMessage as MessageFeedResponse } from '@/types/messages.types';
import { ClockIcon, EnvelopeIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader, Skeleton, Badge } from '@heroui/react';
import { useAtom } from 'jotai';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type MessageFeedCardProps = {
  message: MessageFeedResponse;
};

export type FilteredParentChild = {
  relationship: string;
  children: Child;
};

type Child = {
  id: string;
  last_name: string;
  first_name: string;
  child_groups?: ChildGroup[];
};

type ChildGroup = {
  group_id: string;
};

export default function MessageFeedCard({ message }: MessageFeedCardProps) {
  const t = useTranslations('MessageCard');
  const format = useFormatter();
  const now = useNow();
  const router = useRouter();

  const {
    message_created_at,
    sender_id,
    sender_first_name,
    sender_last_name,
    sender_role,
    message_content,
    message_attachments,
    is_read,
  } = message;

  const attachments: Attachment[] = Array.isArray(message_attachments)
    ? (message_attachments as unknown as Attachment[])
    : [];
  const imageAttachments = attachments.filter(a => a.contentType.startsWith('image/'));
  const fileAttachments = attachments.filter(a => !a.contentType.startsWith('image/'));
  const hasAttachments = attachments.length > 0;

  const messageDate = new Date(message_created_at as string);

  const [, setReceiver] = useAtom(receiverAtom);
  const [groupContextId] = useAtom(contextGroupValue);
  const [parentSenderChild, setParentSenderChild] =
    useState<FilteredParentChild | null>(null);

  const { data: senderUserChildren, isLoading } = useUserChildrenQuery({
    params: { userID: sender_id, groupID: groupContextId as string },
    options: { enabled: !!sender_id },
  });

  const handlePress = useCallback(() => {
    router.push(`/messages/${sender_id}`);
    setReceiver(prev => ({
      ...prev,
      id: sender_id,
      first_name: sender_first_name,
      last_name: sender_last_name,
      role: sender_role,
    }));
  }, [
    router,
    sender_id,
    sender_first_name,
    sender_last_name,
    sender_role,
    setReceiver,
  ]);

  const fetchParentSenderChild = useCallback(async () => {
    if (!groupContextId) return;

    try {
      const foundChild =
        Array.isArray(senderUserChildren) &&
        senderUserChildren.find(
          child =>
            Array.isArray(child.children?.child_groups) &&
            child.children.child_groups.some(
              group => group.group_id === groupContextId
            )
        );
      setParentSenderChild((foundChild as FilteredParentChild | null) || null);
    } catch {
      // Failed to fetch parent sender children
    }
  }, [groupContextId, senderUserChildren]);

  useEffect(() => {
    if (sender_role === USER_ROLES.PARENT) {
      fetchParentSenderChild();
    }
  }, [fetchParentSenderChild, sender_role]);

  return (
    <Card
      className={`text-white ${
        sender_role === USER_ROLES.ADMIN ? 'bg-secondary-400' : 'bg-success-600'
      }`}
      isPressable
      onPress={handlePress}
    >
      <CardHeader className="gap-2 items-start">
        <div>
          <Badge
            color="danger"
            isInvisible={is_read as boolean}
            shape="circle"
            variant="solid"
            content=""
          >
            <EnvelopeIcon className="w-6 h-6" />
          </Badge>
        </div>
        <div className="text-left flex-1">
          <h3 className="text-medium">{t('title')}</h3>
          <Skeleton
            className="rounded-lg bg-success-700 bg-blend-multiply"
            disableAnimation={true}
            isLoaded={!isLoading}
          >
            <p className="text-tiny text-white/50">
              {t('senderInfo', { senderName: sender_first_name })}
              {parentSenderChild &&
                t('childInfo', {
                  relationship: parentSenderChild.relationship,
                  childName: `${parentSenderChild.children.first_name} ${parentSenderChild.children.last_name}`,
                })}
            </p>
          </Skeleton>
        </div>
        <div className="flex justify-end items-center gap-2 text-tiny">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span>{format.relativeTime(messageDate, now)}</span>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {/* Message text content */}
        {message_content ? (
          <p className="text-small pl-8">{message_content}</p>
        ) : null}

        {/* Attachment summary */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-2 pl-8 mt-1">
            {imageAttachments.length > 0 && (
              <span className="flex items-center gap-1 text-small text-white/70">
                <PhotoIcon className="w-4 h-4 shrink-0" />
                {imageAttachments.length === 1
                  ? t('attachmentImage', { defaultValue: '1 image' })
                  : t('attachmentImages', { count: imageAttachments.length, defaultValue: `${imageAttachments.length} images` })}
              </span>
            )}
            {fileAttachments.length > 0 && (
              <span className="flex items-center gap-1 text-small text-white/70">
                <DocumentIcon className="w-4 h-4 shrink-0" />
                {fileAttachments.length === 1
                  ? t('attachmentFile', { defaultValue: '1 file' })
                  : t('attachmentFiles', { count: fileAttachments.length, defaultValue: `${fileAttachments.length} files` })}
              </span>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
