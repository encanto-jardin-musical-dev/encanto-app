"use client";
import useChildrenCountQuery from "@/hooks/UseChildrenCountQuery";
import useTodayPresentCountQuery from "@/hooks/UseTodayPresentCountQuery";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { AssistanceMetric } from "./AssistanceMetric";

export function AdminSummaryPanel() {
  const t = useTranslations("AdminOptionsPage");
  const { data: totalKids, isLoading: isTotalKidsLoading } = useChildrenCountQuery();
  const { data: presentCount, isLoading: isPresentCountLoading } = useTodayPresentCountQuery();

  const isAssistanceLoading = isTotalKidsLoading || isPresentCountLoading;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-default-500">{t("summary.totalKids")}</span>
        <span className="text-6xl font-bold">
          {isTotalKidsLoading ? "—" : totalKids}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <span className="text-default-500">{t("assistance.title")}</span>
        <div className="flex justify-center w-full">
          {isAssistanceLoading ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-small text-default-500">{t("assistance.childCare")}</span>
              <span className="text-2xl font-bold">—</span>
            </div>
          ) : (
            <Link href="/admin/attendance" className="hover:opacity-80 transition-opacity">
              <AssistanceMetric
                label={t("assistance.childCare")}
                current={presentCount ?? 0}
                total={totalKids ?? 0}
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
