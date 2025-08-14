'use client';

import { checkAndRequestPermission } from '@/utils/pushNotifications';
import { BellIcon } from '@heroicons/react/24/outline';
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('UserFeedPage.FeedUser');

  // Check current permissions when component mounts
  useEffect(() => {
    const currentPermission = getCurrentNotificationPermission();
    setPushPermission(currentPermission);
  }, []);

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          aria-label="Notification settings"
          className="text-foreground"
        >
          <Badge
            color="danger"
            shape="circle"
            content=""
            isInvisible={pushPermission === 'granted'}
            isDot
          >
            <BellIcon className="w-5 h-5" />
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="px-1 py-2">
          <h4 className="text-lg font-medium text-foreground mb-2">
            {t('notifications.title')}
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('notifications.enable')}
              </p>
              <p className="text-xs text-default-500">
                {t('notifications.description')}
              </p>
              {pushPermission === 'denied' && (
                <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded-md">
                  <p className="text-xs text-danger font-medium mb-1">
                    {t('notifications.permissionsBlocked')}
                  </p>
                  <p className="text-xs text-danger">
                    {t('notifications.permissionsBlockedDescription')}
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
                  {t('notifications.activateButton')}
                </Button>
              ) : pushPermission === 'granted' ? (
                <Button size="sm" variant="solid" color="success" isDisabled>
                  {t('notifications.activeStatus')}
                </Button>
              ) : (
                <Button size="sm" variant="bordered" color="danger" isDisabled>
                  {t('notifications.blockedStatus')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
