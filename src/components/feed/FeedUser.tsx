'use client';

import { USER_ROLES } from '@/lib/const';
import { groupContextSelectedAtom } from '@/lib/store/common';
import { userSelectOptionsAtom } from '@/lib/store/user';
import type { UserProfile } from '@/types/auth.types';
import { checkAndRequestPermission } from '@/utils/pushNotifications';
import { Avatar, Select, SelectItem, useDisclosure } from '@heroui/react';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import FeedUserHeader from './FeedUserHeader';
import { AvatarEditModal } from './AvatarEditModal';

type FeedUserProps = {
  user: UserProfile;
  avatarSignedUrl?: string | null;
};

export default function FeedUser({ user, avatarSignedUrl }: FeedUserProps) {
  const [selectOptions] = useAtom(userSelectOptionsAtom);
  const [groupContextSelection, setGroupContextSelection] = useAtom(
    groupContextSelectedAtom
  );
  const t = useTranslations('UserFeedPage.FeedUser');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Local signed URL — updated after a successful avatar save without re-fetching the page
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(
    avatarSignedUrl ?? null
  );

  // check push notification permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log(
          '[FeedUser] Starting push notification permission check...'
        );
        const permission = await checkAndRequestPermission();
        console.log(
          '[FeedUser] Push notification permission result:',
          permission
        );
      } catch (error) {
        console.error(
          '[FeedUser] Error checking push notification permissions:',
          error
        );
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      checkPermissions();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // group context selection (Decision 4: stays in FeedUser, coupled to feed UI)
  useEffect(() => {
    if (selectOptions.length > 0 && groupContextSelection === undefined) {
      if (selectOptions[0]?.key !== undefined) {
        const initialValue = new Set([selectOptions[0].key]);
        setGroupContextSelection(initialValue);
      }
    }
  }, [selectOptions, groupContextSelection, setGroupContextSelection]);

  // get select placeholder
  const getSelectPlaceholder = () => {
    if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.TEACHER) {
      return t('placeholders.other', { count: selectOptions.length });
    }
    return t('placeholders.parent', { count: selectOptions.length });
  };

  // get select label
  const getSelectLabel = () => {
    if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.TEACHER) {
      return t('labels.other', { count: selectOptions.length });
    }
    return t('labels.parent', { count: selectOptions.length });
  };

  const getSelectedKey = () => {
    if (selectOptions.length > 0 && groupContextSelection) {
      return groupContextSelection;
    }
    return 'all';
  };

  return (
    <div className="w-full">
      <FeedUserHeader user={user} />
      <div className="flex w-full gap-4 pt-4">
        <div>
          <button
            type="button"
            onClick={onOpen}
            className="active:opacity-70"
            aria-label={t('avatarModal.openAriaLabel')}
          >
            <Avatar
              size="lg"
              name={user?.first_name}
              color="primary"
              src={localAvatarUrl ?? undefined}
              isBordered
            />
          </button>
        </div>
        <Select
          label={getSelectLabel()}
          items={selectOptions}
          placeholder={getSelectPlaceholder()}
          selectedKeys={getSelectedKey()}
          onSelectionChange={setGroupContextSelection}
          isDisabled={user.role === USER_ROLES.TEACHER}
        >
          {option => <SelectItem key={option.key} textValue={option.label}>{option.label}</SelectItem>}
        </Select>
      </div>

      <AvatarEditModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        userId={user.id}
        userRole={user.role}
        currentAvatarUrl={localAvatarUrl}
        onSaved={(newUrl) => setLocalAvatarUrl(newUrl)}
      />
    </div>
  );
}
