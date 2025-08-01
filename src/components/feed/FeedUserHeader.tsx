'use client';

import {
  pushNotificationPermissionAtom,
  userNotificationSettingsAtom,
} from '@/lib/store/user';
import type { UserProfile } from '@/types/auth.types';
import {
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/utils/pushNotifications';
import { BellIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from '@heroui/react';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

type FeedUserHeaderProps = {
  user: UserProfile;
};

export default function FeedUserHeader({ user }: FeedUserHeaderProps) {
  const [notificationSettings, setNotificationSettings] = useAtom(
    userNotificationSettingsAtom
  );
  const [pushPermission, setPushPermission] = useAtom(
    pushNotificationPermissionAtom
  );
  const t = useTranslations('UserFeedPage.FeedUser');

  // Sync notification settings with push permission on mount
  useEffect(() => {
    const currentPermission = getNotificationPermission();
    setPushPermission(currentPermission);

    // If user has notification settings enabled but no permission, disable settings
    if (notificationSettings && currentPermission === 'denied') {
      setNotificationSettings(false);
    }
  }, [notificationSettings, setNotificationSettings, setPushPermission]);

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationSettings(enabled);

    if (enabled) {
      // Enable push notifications
      try {
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setPushPermission('granted');
          console.log('Push notifications enabled successfully');
        } else {
          // If subscription failed, disable the setting
          setNotificationSettings(false);
          setPushPermission('denied');
        }
      } catch (error) {
        console.error('Failed to enable push notifications:', error);
        setNotificationSettings(false);
        setPushPermission('denied');
      }
    } else {
      // Disable push notifications
      try {
        await unsubscribeFromPushNotifications();
        setPushPermission('denied');
        console.log('Push notifications disabled successfully');
      } catch (error) {
        console.error('Failed to disable push notifications:', error);
      }
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <h1>
        {t('greeting', {
          name: `${user?.first_name} ${user?.last_name}`,
        })}
      </h1>
      <Popover placement="bottom-end">
        <PopoverTrigger>
          <Button
            isIconOnly
            variant="light"
            aria-label="Notification settings"
            className="text-foreground"
          >
            <BellIcon className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="px-1 py-2">
            <h4 className="text-lg font-medium text-foreground mb-2">
              {t('notifications.title')}
            </h4>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t('notifications.enable')}
                </p>
                <p className="text-xs text-default-500">
                  {t('notifications.description')}
                </p>
                {pushPermission === 'denied' && (
                  <p className="text-xs text-danger mt-1">
                    {t('notifications.permissionDenied')}
                  </p>
                )}
              </div>
              <Switch
                isSelected={notificationSettings}
                onValueChange={handleNotificationToggle}
                size="sm"
                isDisabled={pushPermission === 'denied'}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
