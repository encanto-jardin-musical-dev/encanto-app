"use client";
import { ReportChildSelect } from "@/components/attendance/report/ReportChildSelect";
import {
  ReportDateRange,
  type ReportCustomRange,
  type ReportPreset,
} from "@/components/attendance/report/ReportDateRange";
import { ReportGroupSelect } from "@/components/attendance/report/ReportGroupSelect";
import {
  ReportResults,
  type SubmittedReportFilters,
} from "@/components/attendance/report/ReportResults";
import type { GroupChildRow } from "@/queries/attendance/get-group-children";
import { getReportDateRange, getReportRangeError } from "@/utils/dates";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type SelectedChild = Pick<GroupChildRow, "id" | "first_name" | "last_name">;

export function AttendanceReport() {
  const t = useTranslations("AttendanceReport");

  const [groupId, setGroupId] = useState<string | null>(null);
  const [child, setChild] = useState<SelectedChild | null>(null);
  const [preset, setPreset] = useState<ReportPreset>("last7");
  const [customRange, setCustomRange] = useState<ReportCustomRange | null>(null);
  // Snapshot of the filters at the moment Generate was pressed. Cleared on any
  // filter change so displayed rows always match the visible filters.
  const [submitted, setSubmitted] = useState<SubmittedReportFilters | null>(null);

  const range = useMemo(() => {
    if (preset !== "custom") return getReportDateRange(preset);
    return customRange
      ? { from: customRange.start.toString(), to: customRange.end.toString() }
      : null;
  }, [preset, customRange]);

  const rangeError = range ? getReportRangeError(range.from, range.to) : null;
  const canGenerate = !!groupId && !!child && !!range && !rangeError;

  const handleGroupChange = (id: string | null) => {
    setGroupId(id);
    setChild(null);
    setSubmitted(null);
  };

  const handleChildChange = (next: GroupChildRow | null) => {
    setChild(next);
    setSubmitted(null);
  };

  const handlePresetChange = (next: ReportPreset) => {
    setPreset(next);
    setSubmitted(null);
  };

  const handleCustomRangeChange = (next: ReportCustomRange | null) => {
    setCustomRange(next);
    setSubmitted(null);
  };

  const handleGenerate = () => {
    if (!canGenerate || !child || !range) return;
    setSubmitted({
      childId: child.id,
      childName: `${child.first_name} ${child.last_name}`,
      from: range.from,
      to: range.to,
    });
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:overflow-hidden lg:h-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleGenerate();
        }}
      >
        <ReportGroupSelect value={groupId} onChange={handleGroupChange} />
        <ReportChildSelect groupId={groupId} value={child?.id ?? null} onChange={handleChildChange} />
        <ReportDateRange
          preset={preset}
          onPresetChange={handlePresetChange}
          customRange={customRange}
          onCustomRangeChange={handleCustomRangeChange}
          error={rangeError}
        />
        <Button type="submit" color="primary" isDisabled={!canGenerate}>
          {t("generate")}
        </Button>
      </form>
      <div className="lg:overflow-y-auto lg:h-full">
        {submitted && <ReportResults filters={submitted} />}
      </div>
    </div>
  );
}
