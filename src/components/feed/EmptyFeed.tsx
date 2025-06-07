import { InboxIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

export default function EmptyFeed() {
  const t = useTranslations("UserFeedPage");

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full text-default-300 pb-20">
      <InboxIcon className="w-16 h-16" />
      <p>{t("GroupFeed.emptyFeed")}</p>
    </div>

  )
}
