'use client';

import useSendMessage from '@/hooks/UseSendMessageMutation';
import { useGetProfileByIdQuery } from '@/hooks/UseGetProfileByIdQuery';
import { USER_ROLES } from '@/lib/const';
import { contextGroupValue } from '@/lib/store/common';
import { userIdAtom, userRoleAtom } from '@/lib/store/user';
import { Database } from '@/types/database.types';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';
import { addToast, Button, Textarea } from '@heroui/react';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type MessageInputProps = {
  receiverId: string;
};

export default function MessageInput({ receiverId }: MessageInputProps) {
  const t = useTranslations('MessagesInput');
  const [content, setContent] = useState('');
  const [userId] = useAtom(userIdAtom);
  const [userRole] = useAtom(userRoleAtom);
  const [groupContextId] = useAtom(contextGroupValue);

  const {
    data: receiverProfile,
    isPending: isProfilePending,
    isError: isProfileError,
  } = useGetProfileByIdQuery(receiverId);
  const isReceiverMissing =
    isProfileError || (!isProfilePending && !receiverProfile);

  const { mutate: sendMessageMutation } = useSendMessage();

  const handleSubmit = async () => {
    const newMessage: Database['public']['Tables']['messages']['Insert'] = {
      content,
      sender_id: userId,
      receiver_id: receiverId,
      group_id:
        userRole === USER_ROLES.TEACHER ? (groupContextId as string) : null,
    };
    if (newMessage.content) {
      sendMessageMutation(newMessage);
    } else {
      addToast({
        title: t('emptyMessageTitle', { defaultValue: 'Mensaje vacío' }),
        description: t('emptyMessageDescription', {
          defaultValue: 'No puedes enviar un mensaje vacío.',
        }),
        color: 'warning',
        hideIcon: true,
      });
      return;
    }
    setContent('');
  };

  return (
    <div className="flex gap-2 justify-around items-end">
      <Textarea
        variant="bordered"
        minRows={1}
        placeholder={t('placeholder')}
        isClearable
        value={content}
        onValueChange={setContent}
        name="messageInput"
        isDisabled={isReceiverMissing}
      />
      {userRole !== 'parent' ? (
        <Button isIconOnly aria-label="add files" isDisabled>
          <PlusIcon className="w-4 h-4" />
        </Button>
      ) : null}
      <Button
        isIconOnly
        aria-label="submit message"
        color="primary"
        onPress={handleSubmit}
        isDisabled={!content.trim() || isReceiverMissing}
      >
        <PaperAirplaneIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
