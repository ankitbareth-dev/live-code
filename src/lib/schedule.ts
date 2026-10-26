import type {
  Appointment,
  AppointmentStatus,
  DateKey,
  MinuteOfDay,
  Service,
  SlotSelection,
  SlotUnavailableReason,
  TimeSlot,
} from "../types/domain";
import {
  addDaysToKey,
  daysBetweenKeys,
  makeDate,
  toDateStringKey,
} from "./datetime";
import { formatDuration, formatTime } from "./format";

/* ------------------------------------------------------------------------
   THE scheduling policy — single source of truth for every booking rule.
   Changing a value here re-behaves the entire app; no component hardcodes
   any of these numbers. (Documented again in README "Booking rules".)
   ------------------------------------------------------------------------ */

export interface SchedulingPolicy {
  /** Date.getDay() values that accept bookings: 0 = Sun … 6 = Sat. */
  readonly openWeekdays: readonly number[];
  /** First bookable start, minutes since local midnight. */
  readonly openingTimeMinutes: MinuteOfDay;
  /** Nothing may finish after this. */
  readonly closingTimeMinutes: MinuteOfDay;
  /** Slot grid — every appointment starts on a multiple of this. */
  readonly slotIntervalMinutes: number;
  /** Minimum minutes between "now" and an appointment's start. */
  readonly minLeadTimeMinutes: number;
  /** How many days ahead dates can be selected (0 = today). */
  readonly maxAdvanceDays: number;
}

export const SCHEDULING_POLICY: SchedulingPolicy = {
  openWeekdays: [1, 2, 3, 4, 5], // Monday–Friday
  openingTimeMinutes: 10 * 60, // 10:00 am
  closingTimeMinutes: 18 * 60, // 6:00 pm
  slotIntervalMinutes: 30,
  minLeadTimeMinutes: 120, // 2 hours notice
  maxAdvanceDays: 60,
};

/**
 * Policy notes (stated explicitly, per requirements):
 * - Appointments NEVER cross midnight: a booking must finish before closing
 *   time, so the last legal start = closing − service duration.
 * - Intervals are half-open [start, end): back-to-back bookings are allowed,
 *   and the conflict test below is the ONLY overlap rule in the app.
 * - Only 'confirmed' appointments block slots — cancelled ones release their
 *   slot automatically by simply not participating in the check.
 * - Same-day booking is allowed when the slot respects the lead time.
 * - All math uses local time via lib/datetime (no UTC string parsing),
 *   so end-of-month, leap years, and DST-safe day counts are centralized.
 */

/** Human-readable explanation for every unavailability reason. Kept next to
 *  the policy so wording can never drift from the rules that produce it. */
export const SLOT_UNAVAILABLE_MESSAGES: Record<SlotUnavailableReason, string> =
  {
    "in-the-past": "This time has already passed.",
    "insufficient-lead-time": `Too close to book — appointments need ${formatDuration(
      SCHEDULING_POLICY.minLeadTimeMinutes,
    )} of notice.`,
    "already-booked": "This time is already booked.",
    "does-not-fit-closing-time": `This service won’t finish before closing time (${formatTime(
      SCHEDULING_POLICY.closingTimeMinutes,
    )}).`,
  };

/* ------------------------------------------------------------------------
   Date-range helpers (feed the date picker)
   ------------------------------------------------------------------------ */

export function isOpenOn(dateKey: DateKey): boolean {
  const weekday = makeDate(dateKey).getDay();
  return SCHEDULING_POLICY.openWeekdays.includes(weekday);
}

/** Inside the booking window [today, today + maxAdvanceDays] AND an open day.
 *  "Today" is derived from the injected `now` — no hidden clock reads here. */
export function isDateSelectable(dateKey: DateKey, now: Date): boolean {
  if (!isOpenOn(dateKey)) return false;
  const today = toDateStringKey(now);
  const daysAhead = daysBetweenKeys(today, dateKey);
  return daysAhead >= 0 && daysAhead <= SCHEDULING_POLICY.maxAdvanceDays;
}

/** Every selectable calendar day, in order. Closed weekdays are omitted —
 *  the picker shows only days that can actually be booked. */
export function listSelectableDates(now: Date): DateKey[] {
  const first = toDateStringKey(now);
  const keys: DateKey[] = [];
  for (
    let offset = 0;
    offset <= SCHEDULING_POLICY.maxAdvanceDays;
    offset += 1
  ) {
    const key = addDaysToKey(first, offset);
    if (isOpenOn(key)) keys.push(key);
  }
  return keys;
}

/* ------------------------------------------------------------------------
   Slot generation — the availability rule, implemented once
   ------------------------------------------------------------------------ */

interface TimeInterval {
  start: MinuteOfDay;
  end: MinuteOfDay;
}

/** Half-open interval overlap — the ONLY overlap comparison in the codebase. */
function intervalsOverlap(
  aStart: MinuteOfDay,
  aEnd: MinuteOfDay,
  bStart: MinuteOfDay,
  bEnd: MinuteOfDay,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function confirmedIntervalsOn(
  dateKey: DateKey,
  appointments: readonly Appointment[],
): readonly TimeInterval[] {
  return appointments
    .filter(
      (appointment) =>
        appointment.lifecycle === "confirmed" && appointment.date === dateKey,
    )
    .map((appointment) => ({
      start: appointment.startMinutes,
      end: appointment.startMinutes + appointment.durationMinutes,
    }));
}

/**
 * Evaluates one grid position. Precondition (guaranteed by callers):
 * startMinutes is aligned to the slot grid and within opening hours.
 * Reason precedence is deterministic: past → lead time → closing fit → booked.
 */
function evaluateSlot(
  service: Service,
  dateKey: DateKey,
  startMinutes: MinuteOfDay,
  bookedIntervals: readonly TimeInterval[],
  now: Date,
): TimeSlot {
  const { closingTimeMinutes, minLeadTimeMinutes } = SCHEDULING_POLICY;

  const unavailable = (reason: SlotUnavailableReason): TimeSlot => ({
    startMinutes,
    isAvailable: false,
    reason,
  });

  const startAt = makeDate(dateKey, startMinutes);
  const msUntilStart = startAt.getTime() - now.getTime();
  if (msUntilStart <= 0) return unavailable("in-the-past");
  if (msUntilStart < minLeadTimeMinutes * 60_000)
    return unavailable("insufficient-lead-time");

  const endMinutes = startMinutes + service.durationMinutes;
  if (endMinutes > closingTimeMinutes)
    return unavailable("does-not-fit-closing-time");

  const overlapsBooking = bookedIntervals.some((interval) =>
    intervalsOverlap(startMinutes, endMinutes, interval.start, interval.end),
  );
  if (overlapsBooking) return unavailable("already-booked");

  return { startMinutes, isAvailable: true, reason: null };
}

/** All slots for one service on one day — bookable and non-bookable, so the
 *  UI can disable the latter and explain why (never silently hide them). */
export function generateSlots(options: {
  service: Service;
  dateKey: DateKey;
  appointments: readonly Appointment[];
  now: Date;
}): TimeSlot[] {
  const { service, dateKey, appointments, now } = options;
  if (!isOpenOn(dateKey)) return [];

  const { openingTimeMinutes, closingTimeMinutes, slotIntervalMinutes } =
    SCHEDULING_POLICY;
  const bookedIntervals = confirmedIntervalsOn(dateKey, appointments);

  const slots: TimeSlot[] = [];
  for (
    let start = openingTimeMinutes;
    start < closingTimeMinutes;
    start += slotIntervalMinutes
  ) {
    slots.push(evaluateSlot(service, dateKey, start, bookedIntervals, now));
  }
  return slots;
}

/** The conflict rule, exposed for write-time re-checks: the storage layer
 *  calls this immediately before committing a new booking, and the review
 *  step calls it before enabling "Confirm". Returns the blocking appointment. */
export function findConflictingAppointment(
  candidate: {
    date: DateKey;
    startMinutes: MinuteOfDay;
    durationMinutes: number;
  },
  appointments: readonly Appointment[],
): Appointment | undefined {
  const candidateEnd = candidate.startMinutes + candidate.durationMinutes;
  return appointments.find(
    (appointment) =>
      appointment.lifecycle === "confirmed" &&
      appointment.date === candidate.date &&
      intervalsOverlap(
        candidate.startMinutes,
        candidateEnd,
        appointment.startMinutes,
        appointment.startMinutes + appointment.durationMinutes,
      ),
  );
}

/** Final-confirmation guard: revalidates service × date × time against the
 *  CURRENT clock and CURRENT bookings. Covers every stale-selection case:
 *  the slot filled up, the service changed, midnight/lead time passed, or the
 *  user kept an old draft across a refresh. */
export function isSelectionStillBookable(options: {
  service: Service;
  selection: SlotSelection;
  appointments: readonly Appointment[];
  now: Date;
}): boolean {
  const { service, selection, appointments, now } = options;
  const { openingTimeMinutes, closingTimeMinutes, slotIntervalMinutes } =
    SCHEDULING_POLICY;

  if (!isDateSelectable(selection.date, now)) return false;

  const aligned =
    (selection.startMinutes - openingTimeMinutes) % slotIntervalMinutes === 0 &&
    selection.startMinutes >= openingTimeMinutes &&
    selection.startMinutes < closingTimeMinutes;
  if (!aligned) return false;

  const slot = evaluateSlot(
    service,
    selection.date,
    selection.startMinutes,
    confirmedIntervalsOn(selection.date, appointments),
    now,
  );
  return slot.isAvailable;
}

/* ------------------------------------------------------------------------
   Status derivation & cancellation eligibility
   ------------------------------------------------------------------------ */

/**
 * The ONLY place appointment status comes from. 'cancelled' is stored
 * lifecycle; 'completed' is derived (end time at or before `now`) and is
 * never written to storage — reopening the app later can't rewrite history.
 */
export function getAppointmentStatus(
  appointment: Appointment,
  now: Date,
): AppointmentStatus {
  if (appointment.lifecycle === "cancelled") return "cancelled";
  const end = makeDate(
    appointment.date,
    appointment.startMinutes + appointment.durationMinutes,
  );
  return end.getTime() <= now.getTime() ? "completed" : "upcoming";
}

/** Cancellation eligibility — one rule, shared by the dashboard UI and any
 *  future confirmation dialog logic. Completed/cancelled => not cancellable. */
export function isCancellable(appointment: Appointment, now: Date): boolean {
  return (
    appointment.lifecycle === "confirmed" &&
    getAppointmentStatus(appointment, now) === "upcoming"
  );
}
