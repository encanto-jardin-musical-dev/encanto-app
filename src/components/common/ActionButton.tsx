"use client";
import { useStaffActionItems } from "@/hooks/UseNavItems";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useState } from "react";

export function ActionButton() {
  const t = useTranslations("ActionButton");
  const tActions = useTranslations("ActionButton.actions");
  const router = useRouter();
  const suboptionsEnabled =
    useFeatureFlagEnabled("action_button_options") === true;
  const { isStaff, actions } = useStaffActionItems();
  const [isOpen, setIsOpen] = useState(false);

  const showSuboptions = suboptionsEnabled && isStaff;

  const navigate = (route: string) => {
    setIsOpen(false);
    router.push(route);
  };

  // Fallback path: flag off/undefined for everyone, and parents always
  // navigate directly to create a new message.
  if (!showSuboptions) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
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
    <div className="fixed bottom-8 right-8 z-50">
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
