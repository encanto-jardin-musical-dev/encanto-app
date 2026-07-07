"use client";

import { feedFilterAtom, type FeedFilter } from "@/lib/store/feed";
import { Chip } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useFeatureFlagEnabled } from "posthog-js/react";

export default function FeedFilters() {
  const t = useTranslations("UserFeedPage.FeedFilters");
  const [filter, setFilter] = useAtom(feedFilterAtom);
  const tasksEnabled = useFeatureFlagEnabled("admin_options_tasks") === true;

  const select = (value: FeedFilter) => {
    setFilter((current) => (current === value ? "all" : value));
  };

  return (
    <div className="w-full flex gap-2">
      <Chip
        color={filter === "all" ? "primary" : "default"}
        radius="sm"
        className="cursor-pointer"
        onClick={() => setFilter("all")}
      >
        {t("all")}
      </Chip>
      <Chip
        color={filter === "messages" ? "primary" : "default"}
        radius="sm"
        className="cursor-pointer"
        onClick={() => select("messages")}
      >
        {t("messages")}
      </Chip>
      <Chip radius="sm" isDisabled>
        {t("reports")}
      </Chip>
      <Chip
        color={filter === "tasks" ? "primary" : "default"}
        radius="sm"
        isDisabled={!tasksEnabled}
        className={tasksEnabled ? "cursor-pointer" : undefined}
        onClick={() => tasksEnabled && select("tasks")}
      >
        {t("tasks")}
      </Chip>
    </div>
  );
}
