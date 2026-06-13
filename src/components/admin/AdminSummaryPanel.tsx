"use client";
import useChildrenCountQuery from "@/hooks/UseChildrenCountQuery";
import { adminAssistance } from "@/lib/mock/adminAssistance";
import { useTranslations } from "next-intl";
import { AssistanceMetric } from "./AssistanceMetric";

export function AdminSummaryPanel() {
  const t = useTranslations("AdminOptionsPage");
  const { data: totalKids, isLoading } = useChildrenCountQuery();

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-default-500">{t("summary.totalKids")}</span>
        <span className="text-6xl font-bold">
          {isLoading ? "—" : totalKids}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <span className="text-default-500">{t("assistance.title")}</span>
        <div className="flex justify-around w-full">
          <AssistanceMetric
            label={t("assistance.childCare")}
            current={adminAssistance.childCare.current}
            total={adminAssistance.childCare.total}
          />
          <AssistanceMetric
            label={t("assistance.workshops")}
            current={adminAssistance.workshops.current}
            total={adminAssistance.workshops.total}
          />
        </div>
      </div>
    </div>
  );
}
