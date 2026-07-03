/**
 * Formats a time value from the database into a locale time string.
 * Handles PostgreSQL timestamps, ISO strings, and time-only strings safely.
 */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";

  let date: Date;

  // If the value looks like a time-only string (e.g. "08:30:00" or "08:30:00+00"),
  // prepend a fixed date so JS can parse it.
  if (/^\d{2}:\d{2}(:\d{2})?/.test(value) && !value.includes("T")) {
    date = new Date(`1970-01-01T${value}`);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
