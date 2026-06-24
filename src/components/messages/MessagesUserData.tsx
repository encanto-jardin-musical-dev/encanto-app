'use client';

import { useGetProfileByIdQuery } from '@/hooks/UseGetProfileByIdQuery';
import { receiverAtom } from '@/lib/store/messages';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import { Avatar } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type UserRole = Database['public']['Enums']['user_role'];
const VALID_ROLES: UserRole[] = ['admin', 'teacher', 'parent'];

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** Maps a profile role to its storage bucket. */
function avatarBucket(role: string | null | undefined): string | null {
  if (role === 'teacher') return 'teacher-avatars';
  if (role === 'parent') return 'parent-avatars';
  if (role === 'admin') return 'admin-avatars';
  return null;
}

type MessagesUserDataProps = {
  senderID: string;
};

export default function MessagesUserData({ senderID }: MessagesUserDataProps) {
  const t = useTranslations('MessagesUserData');
  const receiverAtomValue = useAtomValue(receiverAtom);

  // Signed URL already resolved by useUserContactsQuery and stored in the atom
  // when the user navigated from the contacts list. Derived on every render so
  // it is available immediately without a useState initializer race.
  const atomAvatarUrl =
    receiverAtomValue?.id === senderID
      ? (receiverAtomValue.avatar_url ?? null)
      : null;

  // Fallback signed URL fetched async — used only when navigating directly by
  // URL (atom is empty / doesn't match) or to refresh an expired URL.
  const [fetchedSignedUrl, setFetchedSignedUrl] = useState<string | null>(null);

  // The URL to display: prefer the atom value (instant, no flicker),
  // fall back to the async-fetched one.
  const displayAvatarUrl = atomAvatarUrl ?? fetchedSignedUrl;

  const isAtomMatch =
    receiverAtomValue?.id === senderID &&
    !!receiverAtomValue.first_name &&
    !!receiverAtomValue.last_name &&
    !!receiverAtomValue.role &&
    VALID_ROLES.includes(receiverAtomValue.role as UserRole);

  // Don't set initialData.avatar_url — keep it null so React Query always
  // fetches the real profile row (with the raw storage path) and the useEffect
  // below can resolve a fresh signed URL for the direct-navigation case.
  const initialData = isAtomMatch
    ? {
        id: receiverAtomValue!.id as string,
        first_name: receiverAtomValue!.first_name as string,
        last_name: receiverAtomValue!.last_name as string,
        role: receiverAtomValue!.role as UserRole,
        avatar_url: null,
      }
    : undefined;

  const { data: profile, isPending, isError } = useGetProfileByIdQuery(
    senderID,
    { initialData }
  );

  // Resolve a signed URL from the storage path once the real profile is loaded.
  // Only runs when the atom didn't already supply a URL (direct navigation).
  useEffect(() => {
    if (atomAvatarUrl) return; // atom already has it — no need to fetch
    if (!profile?.avatar_url || !profile?.role) return;
    const bucket = avatarBucket(profile.role);
    if (!bucket) return;

    const client = createClient();
    client.storage
      .from(bucket)
      .createSignedUrl(profile.avatar_url, SIGNED_URL_TTL)
      .then(({ data }) => {
        if (data?.signedUrl) setFetchedSignedUrl(data.signedUrl);
      });
  }, [atomAvatarUrl, profile?.avatar_url, profile?.role]);

  const isMissing = isError || (!isPending && !profile);

  if (isMissing) {
    const fallback = t('unavailable');
    return (
      <div className="flex items-center gap-4">
        <div>
          <Avatar size="md" name={fallback} color="default" />
        </div>
        <h1>{fallback}</h1>
      </div>
    );
  }

  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();

  return (
    <div className="flex items-center gap-4">
      <div>
        <Avatar
          size="md"
          name={fullName}
          color="primary"
          src={displayAvatarUrl ?? undefined}
        />
      </div>
      <h1>{fullName}</h1>
    </div>
  );
}
