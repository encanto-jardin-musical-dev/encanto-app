'use client';

import { useGetProfileByIdQuery } from '@/hooks/UseGetProfileByIdQuery';
import { receiverAtom } from '@/lib/store/messages';
import type { Database } from '@/types/database.types';
import { Avatar } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';

type UserRole = Database['public']['Enums']['user_role'];
const VALID_ROLES: UserRole[] = ['admin', 'teacher', 'parent'];

type MessagesUserDataProps = {
  senderID: string;
};

export default function MessagesUserData({ senderID }: MessagesUserDataProps) {
  const t = useTranslations('MessagesUserData');
  const receiverAtomValue = useAtomValue(receiverAtom);

  const initialData =
    receiverAtomValue?.id &&
    receiverAtomValue.id === senderID &&
    receiverAtomValue.first_name &&
    receiverAtomValue.last_name &&
    receiverAtomValue.role &&
    VALID_ROLES.includes(receiverAtomValue.role as UserRole)
      ? {
          id: receiverAtomValue.id,
          first_name: receiverAtomValue.first_name,
          last_name: receiverAtomValue.last_name,
          role: receiverAtomValue.role as UserRole,
          avatar_url: null,
        }
      : undefined;

  const { data: profile, isPending, isError } = useGetProfileByIdQuery(
    senderID,
    { initialData }
  );

  const isMissing = isError || (!isPending && !profile);

  if (isMissing) {
    const fallback = t('unavailable');
    return (
      <div className="flex first-letter: items-center gap-4">
        <div>
          <Avatar size="md" name={fallback} color="default" />
        </div>
        <h1>{fallback}</h1>
      </div>
    );
  }

  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();

  return (
    <div className="flex first-letter: items-center gap-4">
      <div>
        <Avatar size="md" name={fullName} color="primary" />
      </div>
      <h1>{fullName}</h1>
    </div>
  );
}
