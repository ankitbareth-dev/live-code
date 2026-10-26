import type { DateKey, MinuteOfDay } from "../types/domain";

/**
 * Centralized local date/time primitives. All booking date math lives here —
 * components never call `new Date('YYYY-MM-DD')` (UTC-relative, shifts days)
 * and never hand-roll key formatting.
 */

export const MINUTES_PER_DAY = 1440;

const MS_PER_DAY = 86_400_000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses an untrusted value into a valid DateKey, or null.
 * Round-trips through the Date constructor, so impossible dates such as
 * '2026-02-30' are rejected instead of silently shifting to March.
 */
export function parseDateKey(value: unknown): DateKey | null {
  if (typeof value !== "string" || !DATE_KEY_PATTERN.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(year, month - 1, day);
  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return roundTrips ? value : null;
}

export function isDateKey(value: unknown): value is DateKey {
  return parseDateKey(value) !== null;
}

/** Local-midnight Date for a key plus optional minutes-since-midnight. */
export function makeDate(key: DateKey, minutes: MinuteOfDay = 0): Date {
  const parsed = parseDateKey(key);
  if (parsed === null) throw new Error(`Invalid date key: "${key}"`);
  return new Date(
    Number(parsed.slice(0, 4)),
    Number(parsed.slice(5, 7)) - 1,
    Number(parsed.slice(8, 10)),
    Math.floor(minutes / 60),
    minutes % 60,
  );
}

/** Serializes a Date into its local 'YYYY-MM-DD' key. */
export function toDateStringKey(date: Date): DateKey {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): DateKey {
  return toDateStringKey(new Date());
}

/** Add (or subtract) days from a key. Date arithmetic handles month, year,
 *  and leap-day boundaries; results stay a valid local key. */
export function addDaysToKey(key: DateKey, days: number): DateKey {
  const base = makeDate(key);
  base.setDate(base.getDate() + days);
  return toDateStringKey(base);
}

/** Whole-day distance between two keys (negative when `to` is before `from`).
 *  Compared at local noon so DST transitions cannot shift the result. */
export function daysBetweenKeys(from: DateKey, to: DateKey): number {
  const fromNoon = makeDate(from, 12 * 60);
  const toNoon = makeDate(to, 12 * 60);
  return Math.round((toNoon.getTime() - fromNoon.getTime()) / MS_PER_DAY);
}

/** Runtime guard for untrusted persisted values (used by the storage module). */
export function isMinuteOfDay(value: unknown): value is MinuteOfDay {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < MINUTES_PER_DAY
  );
}
