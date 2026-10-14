"use client";
import useAttendanceReportQuery from "@/hooks/UseAttendanceReportQuery";
import {
  buildAttendanceReportCsv,
  buildReportFilename,
  downloadCsv,
} from "@/utils/attendanceReportCsv";
import { formatReportDate, formatReportTime } from "@/utils/dates";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useTranslations } from "next-intl";

export type SubmittedReportFilters = {
  childId: string;
  childName: string;
  from: string;
  to: string;
};

type ReportResultsProps = {
  filters: SubmittedReportFilters;
};

export function ReportResults({ filters }: ReportResultsProps) {
  const t = useTranslations("AttendanceReport");
  const { data: rows, isPending, isError, refetch, isRefetching } =
    useAttendanceReportQuery(filters);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3" data-testid="report-loading">
        <Skeleton className="h-6 w-1/2 rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8" role="alert">
        <p className="text-danger">{t("error")}</p>
        <Button color="primary" variant="flat" isLoading={isRefetching} onPress={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const noCheckOut = t("noCheckOut");
  const display = rows.map((row) => ({
    id: row.attendance_id,
    date: formatReportDate(row.attendance_date),
    checkIn: formatReportTime(row.check_in),
    checkOut: formatReportTime(row.check_out) || noCheckOut,
  }));

  const handleDownload = () => {
    const csv = buildAttendanceReportCsv(rows, {
      date: t("columns.date"),
      checkIn: t("columns.checkIn"),
      checkOut: t("columns.checkOut"),
      noCheckOut,
    });
    downloadCsv(csv, buildReportFilename(filters.childName, filters.from, filters.to));
  };

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-large font-bold">{filters.childName}</h2>
          <p className="text-small text-default-500">
            {t("rangeSummary", {
              from: formatReportDate(filters.from),
              to: formatReportDate(filters.to),
            })}{" "}
            · {t("rowCount", { count: display.length })}
          </p>
        </div>
        {display.length > 0 && (
          <Button
            color="primary"
            variant="flat"
            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
            onPress={handleDownload}
          >
            {t("download")}
          </Button>
        )}
      </div>

      {display.length === 0 ? (
        <p className="text-center text-default-500 py-8">{t("empty")}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2 overflow-y-auto lg:hidden">
            {display.map((row) => (
              <li key={row.id} className="bg-default-100 rounded-lg p-3 flex flex-col gap-1">
                <span className="font-semibold">{row.date}</span>
                <span className="text-small text-default-600">
                  {t("columns.checkIn")}: {row.checkIn}
                </span>
                <span className="text-small text-default-600">
                  {t("columns.checkOut")}: {row.checkOut}
                </span>
              </li>
            ))}
          </ul>
          <div className="hidden lg:block overflow-y-auto">
            <Table aria-label={t("resultsTableLabel")} isHeaderSticky removeWrapper>
              <TableHeader>
                <TableColumn>{t("columns.date")}</TableColumn>
                <TableColumn>{t("columns.checkIn")}</TableColumn>
                <TableColumn>{t("columns.checkOut")}</TableColumn>
              </TableHeader>
              <TableBody items={display}>
                {(row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.checkIn}</TableCell>
                    <TableCell>{row.checkOut}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
