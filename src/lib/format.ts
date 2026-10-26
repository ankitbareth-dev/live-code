import type { DateKey, MinuteOfDay } from "../types/domain";
import { makeDate, todayKey } from "./datetime";

/**
 * Presentation formatting — single authoritative place for currency, duration,
 * date, time, and phone rendering. Locales are pinned (not browser-derived)
 * so business output is deterministic on every device.
 */

const inrCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹4,500 (en-IN grouping — ₹1,00,000 for six digits). */
export function formatPrice(priceInr: number): string {
  return inrCurrency.format(priceInr);
}

/** 45 → "45 min", 60 → "1 hr", 90 → "1 hr 30 min", 120 → "2 hrs". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  const hourPart = hours === 1 ? "1 hr" : `${hours} hrs`;
  return remainder === 0 ? hourPart : `${hourPart} ${remainder} min`;
}

const dateShortFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dateLongFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "Mon, 26 Oct" */
export function formatDateShort(key: DateKey): string {
  return dateShortFormat.format(makeDate(key));
}

/** "Monday, 26 October 2026" */
export function formatDateLong(key: DateKey): string {
  return dateLongFormat.format(makeDate(key));
}

/** "2:30 pm" */
export function formatTime(minutes: MinuteOfDay): string {
  return timeFormat.format(makeDate(todayKey(), minutes));
}

/** "2:30 pm – 4:00 pm". Defensive against midnight-crossing input: the end
 *  simply renders on the next day label; scheduling policy prevents this. */
export function formatTimeRange(
  startMinutes: MinuteOfDay,
  durationMinutes: number,
): string {
  const end = startMinutes + durationMinutes;
  return `${formatTime(startMinutes)} – ${formatTime(end)}`;
}

/** '9876543210' → '+91 98765 43210'. Pass-through for anything unexpected. */
export function formatPhone(normalizedPhone: string): string {
  if (normalizedPhone.length !== 10) return normalizedPhone;
  return `+91 ${normalizedPhone.slice(0, 5)} ${normalizedPhone.slice(5)}`;
}
