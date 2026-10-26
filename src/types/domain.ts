import type { IconType } from "react-icons";

/* ------------------------------------------------------------------------
   Service catalogue
   ------------------------------------------------------------------------ */

export type ServiceCategoryId = "development" | "design" | "strategy";

export interface ServiceCategory {
  id: ServiceCategoryId;
  name: string;
  /** One-line summary used by filter affordances and empty states. */
  description: string;
}

export interface Service {
  /** Stable slug, never renamed — the booking's reference to the catalogue. */
  id: string;
  name: string;
  description: string;
  categoryId: ServiceCategoryId;
  /** Minutes the appointment occupies. Slot grid is 30 min; keep durations multiples of 30. */
  durationMinutes: number;
  /** Whole rupees (sample data does not use paise). */
  priceInr: number;
  icon: IconType;
}

/* ------------------------------------------------------------------------
   Customers & appointments
   ------------------------------------------------------------------------ */

export interface Customer {
  fullName: string;
  email: string;
  /** Normalized 10-digit Indian mobile number — no +91 / 0 prefix. */
  phone: string;
}

/**
 * Persisted lifecycle state. "completed" is intentionally NOT persistable:
 * the user-facing status is derived from time (see getAppointmentStatus in
 * lib/schedule.ts), so historical records can never lie about completion.
 */
export type AppointmentLifecycle = "confirmed" | "cancelled";

/** User-facing status, always derived — never stored. */
export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  /** May reference a service that no longer exists in the catalogue. */
  serviceId: string;
  /** Snapshot denormalized at booking time: survives later catalogue changes. */
  serviceName: string;
  durationMinutes: number;
  priceInr: number;
  customer: Customer;
  /** Local calendar date key 'YYYY-MM-DD'. */
  date: DateKey;
  /** Minutes since local midnight. */
  startMinutes: MinuteOfDay;
  lifecycle: AppointmentLifecycle;
  /** Epoch ms — when the booking was created. */
  createdAt: number;
  /** Epoch ms — when cancelled; null while confirmed. */
  cancelledAt: number | null;
}

/* ------------------------------------------------------------------------
   Scheduling primitives
   ------------------------------------------------------------------------ */

/**
 * Local calendar date, 'YYYY-MM-DD'.
 * NEVER construct a Date from this string (new Date('2026-01-05') is UTC and
 * can shift a day) — always go through lib/datetime parseDateKey / makeDate.
 */
export type DateKey = string;

/** Minutes since local midnight, 0–1439. */
export type MinuteOfDay = number;

export interface SlotSelection {
  date: DateKey;
  startMinutes: MinuteOfDay;
}

export type SlotUnavailableReason =
  | "in-the-past"
  | "insufficient-lead-time"
  | "already-booked"
  | "does-not-fit-closing-time";

export interface TimeSlot {
  startMinutes: MinuteOfDay;
  isAvailable: boolean;
  /** Why the slot cannot be picked; null when isAvailable is true. */
  reason: SlotUnavailableReason | null;
}

/* ------------------------------------------------------------------------
   Booking flow
   ------------------------------------------------------------------------ */

export type BookingStep = "date" | "time" | "details" | "review";

export interface BookingDetailsForm {
  fullName: string;
  email: string;
  phone: string;
}

/**
 * In-progress booking. Nullable fields are legitimately empty mid-flow
 * (users may go back without losing data); the review step revalidates
 * everything against current availability before confirming.
 */
export interface BookingDraft {
  serviceId: string | null;
  date: DateKey | null;
  startMinutes: MinuteOfDay | null;
  details: BookingDetailsForm;
}

export type BookingFormField = keyof BookingDetailsForm;
export type BookingFieldErrors = Partial<Record<BookingFormField, string>>;

/* ------------------------------------------------------------------------
   Operation results — discriminated unions so error handling is exhaustive
   ------------------------------------------------------------------------ */

export type Result<TSuccess, TError> =
  | { ok: true; value: TSuccess }
  | { ok: false; error: TError };

export type CreateAppointmentError =
  /** Re-checked atomically at write time — the slot was taken in this browser. */
  | { code: "slot-taken" }
  | { code: "service-unavailable" }
  | { code: "storage-write-failed" };

export type CancelAppointmentError =
  | { code: "not-found" }
  | { code: "not-cancellable" }
  | { code: "storage-write-failed" };
