"use client";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "@heroui/react";
import { useTranslations } from "next-intl";

type NavigationBarProps = {
  backRoute: string;
  pageTitle?: string;
  rightElement?: React.ReactNode;
};

export default function NavigationBar({
  backRoute,
  pageTitle,
  rightElement,
}: NavigationBarProps) {
  const t = useTranslations("NavigationBar");
  return (
    <div className="grid grid-cols-[.3fr_1fr_.3fr] text-small items-center gap-2">
      <Link href={backRoute} className="flex text-small items-center gap-2">
        <ArrowLeftIcon className="w-4 h-4" />
        {t("back")}
      </Link>
      {pageTitle ? (
        <h1 className="flex-grow text-center font-bold text-primary">
          {pageTitle}
        </h1>
      ) : null}
      {rightElement ? <>{rightElement}</> : null}
    </div>
  );
}
