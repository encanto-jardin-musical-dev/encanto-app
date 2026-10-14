/**
 * The school operates in a single fixed timezone. The attendance day boundary
 * is pinned to this zone on both sides: the clock_in_children/clock_out_children
 * RPCs compute `(now() at time zone 'America/Bogota')::date` for writes, and
 * this helper computes the same calendar date for read filters and query keys.
 * Changing one side without the other splits a day's records across two dates.
 */
export const SCHOOL_TIMEZONE = 'America/Bogota';

/** Today's date (YYYY-MM-DD) in the school's timezone. */
export function todayDateString(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: SCHOOL_TIMEZONE }).format(new Date());
}

export type ReportDatePreset = 'today' | 'last7' | 'thisMonth' | 'lastMonth';

/** Longest inclusive span (days) the attendance report accepts; mirrors the RPC. */
export const MAX_REPORT_RANGE_DAYS = 90;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateString(value: string): Date | null {
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject rollovers such as 2026-02-31
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Inclusive `{ from, to }` (YYYY-MM-DD) for a report preset, computed from the
 * school's `today` so presets agree with how `attendance_date` is written.
 * Pure calendar math on UTC dates — no timezone shifts.
 */
export function getReportDateRange(
  preset: ReportDatePreset,
  today: string = todayDateString()
): { from: string; to: string } {
  const base = parseDateString(today);
  if (!base) throw new Error(`Invalid date: ${today}`);

  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'last7':
      return { from: toDateString(new Date(Date.UTC(year, month, base.getUTCDate() - 6))), to: today };
    case 'thisMonth':
      return { from: toDateString(new Date(Date.UTC(year, month, 1))), to: today };
    case 'lastMonth':
      return {
        from: toDateString(new Date(Date.UTC(year, month - 1, 1))),
        to: toDateString(new Date(Date.UTC(year, month, 0))),
      };
  }
}

export type ReportRangeError = 'invalid' | 'order' | 'tooLong';

/** Validates a report range; returns an error code or `null` when valid. */
export function getReportRangeError(from: string, to: string): ReportRangeError | null {
  const start = parseDateString(from);
  const end = parseDateString(to);
  if (!start || !end) return 'invalid';
  if (end < start) return 'order';
  const days = (end.getTime() - start.getTime()) / 86_400_000 + 1;
  return days > MAX_REPORT_RANGE_DAYS ? 'tooLong' : null;
}

/** True when the range is ordered and within the 90-day inclusive cap. */
export function isValidReportRange(from: string, to: string): boolean {
  return getReportRangeError(from, to) === null;
}

/** Formats a plain `YYYY-MM-DD` attendance date, e.g. "10/10/2026". No timezone shift. */
export function formatReportDate(date: string): string {
  const parsed = parseDateString(date);
  if (!parsed) return date;
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

/** Formats a timestamptz as 24h "HH:mm" in the school timezone. Empty string if invalid. */
export function formatReportTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: SCHOOL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
