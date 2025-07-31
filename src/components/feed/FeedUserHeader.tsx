"use client";

import { userNotificationSettingsAtom } from "@/lib/store/user";
import type { UserProfile } from "@/types/auth.types";
import { BellIcon } from "@heroicons/react/24/outline";
import { Button, Popover, PopoverContent, PopoverTrigger, Switch } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

type FeedUserHeaderProps = {
  user: UserProfile;
};

export default function FeedUserHeader({ user }: FeedUserHeaderProps) {
  const [notificationSettings, setNotificationSettings] = useAtom(userNotificationSettingsAtom);
  const t = useTranslations("UserFeedPage.FeedUser");

  return (
    <div className="flex items-center justify-between w-full">
      <h1>
        {t("greeting", {
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
              {t("notifications.title")}
            </h4>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t("notifications.enable")}
                </p>
                <p className="text-xs text-default-500">
                  {t("notifications.description")}
                </p>
              </div>
              <Switch
                isSelected={notificationSettings}
                onValueChange={setNotificationSettings}
                size="sm"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 