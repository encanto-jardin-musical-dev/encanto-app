"use client";

import { Chip, Link } from "@heroui/react";
import { useTranslations } from "next-intl";

export default function FeedFilters() {
  const t = useTranslations("UserFeedPage.FeedFilters");
  return (
    <div className="w-full flex gap-2">
      <Chip color="primary" radius="sm">
        {t("all")}
      </Chip>
      <Chip radius="sm">{t("messages")}</Chip>
      <Chip radius="sm" as={Link} href="/login" isDisabled>
        {t("reports")}
      </Chip>
      <Link href="/login" isDisabled>
        <Chip radius="sm">{t("tasks")}</Chip>
      </Link>
    </div>
  );
}
