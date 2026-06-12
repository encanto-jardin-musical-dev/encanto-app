"use client";
import { USER_ROLES } from "@/lib/const";
import { userRoleAtom } from "@/lib/store/user";
import {
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useState } from "react";

type ActionItem = {
  key: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const STAFF_ACTIONS: ActionItem[] = [
  { key: "attendance", route: "/attendance", icon: ClockIcon },
  {
    key: "daily-report",
    route: "/daily-report",
    icon: ClipboardDocumentListIcon,
  },
  { key: "tasks", route: "/tasks", icon: DocumentCheckIcon },
  { key: "messages", route: "/messages", icon: ChatBubbleLeftIcon },
  {
    key: "admin-options",
    route: "/admin-options",
    icon: Cog6ToothIcon,
    adminOnly: true,
  },
];

export function ActionButton() {
  const t = useTranslations("ActionButton");
  const router = useRouter();
  const [userRole] = useAtom(userRoleAtom);
  const suboptionsEnabled =
    useFeatureFlagEnabled("action_button_options") === true;
  const [isOpen, setIsOpen] = useState(false);

  const isStaff =
    userRole === USER_ROLES.TEACHER || userRole === USER_ROLES.ADMIN;
  const showSuboptions = suboptionsEnabled && isStaff;

  const actions = STAFF_ACTIONS.filter(
    (action) => !action.adminOnly || userRole === USER_ROLES.ADMIN,
  );

  const navigate = (route: string) => {
    setIsOpen(false);
    router.push(route);
  };

  // Fallback path: flag off/undefined for everyone, and parents always
  // navigate directly to create a new message.
  if (!showSuboptions) {
    return (
      <div className="fixed bottom-8 right-8">
        <Button
          isIconOnly
          aria-label={t("triggerLabel")}
          size="lg"
          color="primary"
          onPress={() => router.push("/messages")}
        >
          <PlusIcon className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8">
      <Popover
        placement="top-end"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <PopoverTrigger>
          <Button isIconOnly aria-label={t("triggerLabel")} size="lg" color="primary">
            <PlusIcon className="w-6 h-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="flex flex-col gap-1 px-1 py-2 w-full">
            {actions.map(({ key, route, icon: Icon }) => {
              const label = t(`actions.${key}`);
              return (
                <Button
                  key={key}
                  variant="light"
                  aria-label={label}
                  className="justify-start text-foreground"
                  startContent={<Icon className="w-5 h-5" />}
                  onPress={() => navigate(route)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
