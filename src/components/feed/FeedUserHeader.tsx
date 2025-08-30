'use client';

import NotificationSettingsPopover from '@/components/common/NotificationSettingsPopover';
import type { UserProfile } from '@/types/auth.types';
import { useTranslations } from 'next-intl';

type FeedUserHeaderProps = {
  user: UserProfile;
};

export default function FeedUserHeader({ user }: FeedUserHeaderProps) {
  const t = useTranslations('UserFeedPage.FeedUser');

  return (
    <div className="flex items-center justify-between w-full">
      <h1>
        {t('greeting', {
          name: `${user?.first_name} ${user?.last_name}`,
        })}
      </h1>
      <NotificationSettingsPopover />
    </div>
  );
}
