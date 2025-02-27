import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "@heroui/react";
import { useTranslations } from "next-intl";

type NavigationBarProps = {
  backRoute: string;
};

export default function NavigationBar({ backRoute }: NavigationBarProps) {
  const t = useTranslations("NavigationBar");
  return (
    <>
      <Link
        href={backRoute}
        className="flex text-small items-center gap-2 pt-10"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        {t("back")}
      </Link>
    </>
  );
}
