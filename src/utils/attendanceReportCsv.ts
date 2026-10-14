import type { AttendanceReportRow } from '@/queries/attendance/get-attendance-report';
import { formatReportDate, formatReportTime } from '@/utils/dates';
import { normalizeSearchText } from '@/utils/text';

export type AttendanceReportCsvHeaders = {
  date: string;
  checkIn: string;
  checkOut: string;
  /** Placeholder for a row without a check-out. */
  noCheckOut: string;
};

const BOM = '﻿';
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

function escapeCell(value: string): string {
  // Neutralize spreadsheet formulas before quoting.
  const safe = FORMULA_PREFIX_RE.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Builds the CSV text (BOM + CRLF, RFC 4180 quoting) for the displayed rows. */
export function buildAttendanceReportCsv(
  rows: AttendanceReportRow[],
  headers: AttendanceReportCsvHeaders
): string {
  const lines = [
    [headers.date, headers.checkIn, headers.checkOut],
    ...rows.map((row) => [
      formatReportDate(row.attendance_date),
      formatReportTime(row.check_in),
      formatReportTime(row.check_out) || headers.noCheckOut,
    ]),
  ].map((cells) => cells.map(escapeCell).join(','));

  return BOM + lines.join('\r\n') + '\r\n';
}

/** `asistencia_<child-slug>_<from>_<to>.csv`, with an accent-free slugified name. */
export function buildReportFilename(childName: string, from: string, to: string): string {
  const slug = normalizeSearchText(childName)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `asistencia_${slug || 'nino'}_${from}_${to}.csv`;
}

/** Saves `content` as a UTF-8 CSV file via a temporary object URL. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
