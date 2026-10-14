"use client";
import type { ReportDatePreset, ReportRangeError } from "@/utils/dates";
import { Chip, DateRangePicker } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { useTranslations } from "next-intl";

export type ReportCustomRange = { start: DateValue; end: DateValue };

export type ReportPreset = ReportDatePreset | "custom";

const PRESETS: ReportPreset[] = ["today", "last7", "thisMonth", "lastMonth", "custom"];

type ReportDateRangeProps = {
  preset: ReportPreset;
  onPresetChange: (preset: ReportPreset) => void;
  customRange: ReportCustomRange | null;
  onCustomRangeChange: (range: ReportCustomRange | null) => void;
  error: ReportRangeError | null;
};

export function ReportDateRange({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
  error,
}: ReportDateRangeProps) {
  const t = useTranslations("AttendanceReport");

  return (
    <div className="flex flex-col gap-3">
      <span className="text-small text-default-600">{t("dateRangeLabel")}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("dateRangeLabel")}>
        {PRESETS.map((key) => (
          <Chip
            key={key}
            as="button"
            type="button"
            aria-pressed={preset === key}
            color="primary"
            variant={preset === key ? "solid" : "bordered"}
            className="cursor-pointer"
            onClick={() => onPresetChange(key)}
          >
            {t(`presets.${key}`)}
          </Chip>
        ))}
      </div>
      {preset === "custom" && (
        <DateRangePicker
          label={t("customRangeLabel")}
          value={customRange}
          onChange={onCustomRangeChange}
          isInvalid={!!error}
          errorMessage={error ? t(`rangeErrors.${error}`) : undefined}
        />
      )}
    </div>
  );
}
