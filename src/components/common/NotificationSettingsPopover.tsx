'use client';

import { signout } from '@/utils/auth/actions';
import { checkAndRequestPermission } from '@/utils/pushNotifications';
import { UserIcon } from '@heroicons/react/24/solid';
import {
  Button,
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

// Function to get current notification permission without requesting it
const getCurrentNotificationPermission = ():
  | 'default'
  | 'granted'
  | 'denied' => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

export default function NotificationSettingsPopover() {
  const [pushPermission, setPushPermission] = useState<
    'default' | 'granted' | 'denied'
  >('default');
  const t = useTranslations('UserFeedPage.FeedUser.settings');

  const posthog = usePostHog();

  // Check current permissions when component mounts
  useEffect(() => {
    const currentPermission = getCurrentNotificationPermission();
    setPushPermission(currentPermission);
  }, []);

  const handleSignOut = () => {
    posthog?.capture('user_signed_out');
    signout();
    posthog?.reset();
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          aria-label="User settings"
          className="text-foreground"
        >
          <UserIcon className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="px-1 py-2">
          <h4 className="text-lg font-medium text-foreground mb-2">
            {t('title')}
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('enable')}
              </p>
              <p className="text-xs text-default-500">{t('description')}</p>
              {pushPermission === 'denied' && (
                <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded-md">
                  <p className="text-xs text-danger font-medium mb-1">
                    {t('permissionsBlocked')}
                  </p>
                  <p className="text-xs text-danger">
                    {t('permissionsBlockedDescription')}
                  </p>
                </div>
              )}
            </div>
            <div>
              {pushPermission === 'default' ? (
                <Button
                  size="sm"
                  variant="solid"
                  color="primary"
                  onPress={async () => {
                    const permission = await checkAndRequestPermission();
                    setPushPermission(permission);
                  }}
                >
                  {t('activateButton')}
                </Button>
              ) : pushPermission === 'granted' ? (
                <Button size="sm" variant="solid" color="success" isDisabled>
                  {t('activeStatus')}
                </Button>
              ) : (
                <Button size="sm" variant="bordered" color="danger" isDisabled>
                  {t('blockedStatus')}
                </Button>
              )}
            </div>
            <Divider />
            <div>
              <Button
                size="sm"
                variant="ghost"
                color="danger"
                onPress={handleSignOut}
              >
                {t('signoutButton')}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
