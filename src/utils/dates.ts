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
