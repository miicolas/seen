export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone: string | undefined | null): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ZonedParts = {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  hour: number; // 0..23
  minute: number;
  second: number;
  weekday: number; // 0=Sun..6=Sat
};

export function tzParts(instant: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(instant)) map[part.type] = part.value;
  let hour = Number(map.hour);
  if (hour === 24) hour = 0; // some engines report midnight as 24
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAYS.indexOf(map.weekday),
  };
}

function tzOffsetMs(instant: Date, timeZone: string): number {
  const p = tzParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - instant.getTime();
}

export function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  let utc = guess - offset;
  const corrected = tzOffsetMs(new Date(utc), timeZone);
  if (corrected !== offset) utc = guess - corrected;
  return new Date(utc);
}

export type CalendarDay = { year: number; month: number; day: number };

export function addCalendarDays(day: CalendarDay, delta: number): CalendarDay {
  const d = new Date(Date.UTC(day.year, day.month - 1, day.day));
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

const pad = (value: number) => String(value).padStart(2, "0");

export function dayKeyOf(day: CalendarDay): string {
  return `${day.year}-${pad(day.month)}-${pad(day.day)}`;
}

export function monthKeyOf(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

export function tzDayKey(instant: Date, timeZone: string): string {
  return dayKeyOf(tzParts(instant, timeZone));
}

export function tzMonthKey(instant: Date, timeZone: string): string {
  const p = tzParts(instant, timeZone);
  return monthKeyOf(p.year, p.month);
}
