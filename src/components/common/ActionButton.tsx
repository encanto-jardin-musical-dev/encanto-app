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
  flag?: string;
};

const STAFF_ACTIONS: ActionItem[] = [
  {
    key: "attendance",
    route: "/attendance",
    icon: ClockIcon,
    flag: "admin_options_attendance",
  },
  {
    key: "daily-report",
    route: "/daily-report",
    icon: ClipboardDocumentListIcon,
    flag: "admin_options_reports",
  },
  {
    key: "tasks",
    route: "/tasks",
    icon: DocumentCheckIcon,
    flag: "admin_options_tasks",
  },
  { key: "messages", route: "/messages", icon: ChatBubbleLeftIcon },
  {
    key: "admin-options",
    route: "/admin",
    icon: Cog6ToothIcon,
    adminOnly: true,
  },
];

export function ActionButton() {
  const t = useTranslations("ActionButton");
  const tActions = useTranslations("ActionButton.actions");
  const router = useRouter();
  const [userRole] = useAtom(userRoleAtom);
  const suboptionsEnabled =
    useFeatureFlagEnabled("action_button_options") === true;
  // Per-action feature flags. Hooks must run unconditionally and in a stable
  // order, so each flag is read here regardless of role. Both `false` and
  // `undefined` (still loading) are treated as off via the `=== true` check.
  const flagState: Record<string, boolean> = {
    admin_options_attendance:
      useFeatureFlagEnabled("admin_options_attendance") === true,
    admin_options_reports:
      useFeatureFlagEnabled("admin_options_reports") === true,
    admin_options_tasks: useFeatureFlagEnabled("admin_options_tasks") === true,
  };
  const [isOpen, setIsOpen] = useState(false);

  const isStaff =
    userRole === USER_ROLES.TEACHER || userRole === USER_ROLES.ADMIN;
  const showSuboptions = suboptionsEnabled && isStaff;

  const actions = STAFF_ACTIONS.filter((action) => {
    const flagAllows = !action.flag || flagState[action.flag] === true;
    const roleAllows = !action.adminOnly || userRole === USER_ROLES.ADMIN;
    return flagAllows && roleAllows;
  });

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
        <PopoverContent className="w-64">
          <div className="flex flex-col gap-1 px-1 py-2 w-full">
            {actions.map(({ key, route, icon: Icon }) => {
              const label = tActions(key);
              return (
                <Button
                  key={key}
                  variant="light"
                  aria-label={label}
                  className="justify-start text-foreground"
                  startContent={<Icon className="w-5 h-5 shrink-0" />}
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
