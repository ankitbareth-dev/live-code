import type {
  Appointment,
  CancelAppointmentError,
  CreateAppointmentError,
  Customer,
  DateKey,
  MinuteOfDay,
  Result,
} from "../types/domain";
import { findService } from "../data/services";
import {
  findConflictingAppointment,
  isCancellable,
  isOpenOn,
} from "../lib/schedule";
import {
  addDaysToKey,
  isDateKey,
  isMinuteOfDay,
  todayKey,
} from "../lib/datetime";

/* ------------------------------------------------------------------------
   THE persistence module — the only file in the app that may access
   localStorage, JSON.parse, or JSON.stringify. All other code goes through
   the single `bookingStorage` object exported below.

   Storage shape (schema v1):
     { "version": 1, "appointments": Appointment[] }

   Failure behavior:
   - Unavailable storage (private mode, blocked): every method degrades to a
     "storage-unavailable" result instead of throwing; the app still works
     in-memory for the session.
   - Malformed JSON / wrong envelope shape: payload is copied to a quarantine
     backup key (best effort), then a fresh envelope is written. Data is never
     silently destroyed.
   - Unsupported (future) schema version: same quarantine treatment, with a
     warning carrying the found version.
   - Individually invalid records: valid records are KEPT, invalid ones are
     dropped (count reported), and the cleaned list is rewritten once so the
     repair is durable.
   - First run (key absent): seeds demo data exactly once — afterwards the key
     exists, so cleared/empty storage is never re-seeded.

   Privacy: bookings (including customer contact details) live unencrypted in
   this browser's localStorage. They are never synced across devices, and the
   booking draft is intentionally kept in memory only so unfinished input is
   never persisted.
   ------------------------------------------------------------------------ */

const STORAGE_KEY = "meridian-booking.appointments";
const BACKUP_KEY = "meridian-booking.appointments.corrupt-backup";
const SCHEMA_VERSION = 1;

/* ------------------------------------------------------------------------
   Public types
   ------------------------------------------------------------------------ */

export interface NewAppointmentInput {
  serviceId: string;
  date: DateKey;
  startMinutes: MinuteOfDay;
  customer: Customer;
}

export type StorageWarning =
  | { kind: "corrupt-data-quarantined" }
  | { kind: "unsupported-version"; foundVersion: number }
  | { kind: "records-dropped"; droppedCount: number }
  | { kind: "storage-unavailable" };

export interface LoadAppointmentsResult {
  appointments: Appointment[];
  warnings: StorageWarning[];
}

/* ------------------------------------------------------------------------
   Internals — runtime validation
   ------------------------------------------------------------------------ */

/** The single narrowing assertion used for untrusted JSON: excludes
 *  null/arrays; everything else is checked field-by-field afterwards. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Full runtime validation of one stored record. TypeScript types alone are
 *  NOT trusted here — storage contents are untrusted runtime data. */
function isStoredAppointment(value: unknown): value is Appointment {
  if (!isRecord(value)) return false;
  const customer = value["customer"];
  if (!isRecord(customer)) return false;

  const duration = value["durationMinutes"];
  const price = value["priceInr"];
  const createdAt = value["createdAt"];
  const cancelledAt = value["cancelledAt"];

  return (
    isNonEmptyString(value["id"]) &&
    isNonEmptyString(value["serviceId"]) &&
    isNonEmptyString(value["serviceName"]) &&
    isDateKey(value["date"]) &&
    isMinuteOfDay(value["startMinutes"]) &&
    typeof duration === "number" &&
    Number.isInteger(duration) &&
    duration > 0 &&
    typeof price === "number" &&
    Number.isFinite(price) &&
    price >= 0 &&
    isNonEmptyString(customer["fullName"]) &&
    isNonEmptyString(customer["email"]) &&
    isNonEmptyString(customer["phone"]) &&
    (value["lifecycle"] === "confirmed" ||
      value["lifecycle"] === "cancelled") &&
    typeof createdAt === "number" &&
    Number.isFinite(createdAt) &&
    (cancelledAt === null ||
      (typeof cancelledAt === "number" && Number.isFinite(cancelledAt)))
  );
}

type ParsedEnvelope =
  | { tag: "corrupt" }
  | { tag: "unsupported-version"; foundVersion: number }
  | { tag: "ok"; records: unknown[] };

function parseEnvelope(raw: string): ParsedEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { tag: "corrupt" };
  }
  if (!isRecord(parsed)) return { tag: "corrupt" };

  const version = parsed["version"];
  if (version !== SCHEMA_VERSION) {
    return typeof version === "number"
      ? { tag: "unsupported-version", foundVersion: version }
      : { tag: "corrupt" };
  }

  const records = parsed["appointments"];
  if (!Array.isArray(records)) return { tag: "corrupt" };
  return { tag: "ok", records };
}

/* ------------------------------------------------------------------------
   Internals — storage access & seeds
   ------------------------------------------------------------------------ */

/** Returns null when storage is unavailable (SSR, private mode, blocked). */
function getLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    // Some browsers throw SecurityError on merely touching localStorage.
    return null;
  }
}

/** The only serialize call in the application. */
function serializeAppointments(appointments: readonly Appointment[]): string {
  return JSON.stringify({ version: SCHEMA_VERSION, appointments });
}

/** The only write call in the application. False = quota/blocked/failed. */
function writeAppointments(
  storage: Storage,
  appointments: readonly Appointment[],
): boolean {
  try {
    storage.setItem(STORAGE_KEY, serializeAppointments(appointments));
    return true;
  } catch {
    // QuotaExceededError, SecurityError (private mode), Safari quirks.
    return false;
  }
}

/** Best-effort backup of unreadable payloads before overwriting them. */
function quarantine(storage: Storage, raw: string): void {
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch {
    // Nothing sensible left to do — the fresh envelope still gets written.
  }
}

/** Stable, unique IDs. crypto.randomUUID covers current browsers; the
 *  fallback keeps non-secure contexts (e.g. plain http LAN preview) working. */
function generateAppointmentId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `apt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** First open (Mon–Fri) day at least `minOffset` days from `base`.
 *  Loop is bounded by a full week. */
function nextOpenDayFrom(base: DateKey, minOffset: number): DateKey {
  let key = addDaysToKey(base, minOffset);
  while (!isOpenOn(key)) key = addDaysToKey(key, 1);
  return key;
}

/**
 * First-run demo data. Includes one appointment whose serviceId does NOT
 * exist in the catalogue anymore ('wordpress-maintenance') — deliberately,
 * to prove bookings render from their denormalized snapshot even when the
 * service is gone. Fixed IDs keep re-seeding idempotent.
 */
function buildSeedAppointments(): Appointment[] {
  const today = todayKey();
  const now = Date.now();

  const seeds: Appointment[] = [];
  const push = (
    id: string,
    serviceId: string,
    snapshot: { name: string; durationMinutes: number; priceInr: number },
    date: DateKey,
    startMinutes: MinuteOfDay,
    lifecycle: Appointment["lifecycle"],
  ): void => {
    seeds.push({
      id,
      serviceId,
      serviceName: snapshot.name,
      durationMinutes: snapshot.durationMinutes,
      priceInr: snapshot.priceInr,
      customer: {
        fullName: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        phone: "9876543210",
      },
      date,
      startMinutes,
      lifecycle,
      createdAt: now,
      cancelledAt: lifecycle === "cancelled" ? now : null,
    });
  };

  const upcoming = findService("architecture-review");
  if (upcoming) {
    push(
      "seed-architecture-review",
      upcoming.id,
      {
        name: upcoming.name,
        durationMinutes: upcoming.durationMinutes,
        priceInr: upcoming.priceInr,
      },
      nextOpenDayFrom(today, 3),
      11 * 60,
      "confirmed",
    );
  }

  const past = findService("ux-usability-audit");
  if (past) {
    push(
      "seed-ux-audit",
      past.id,
      {
        name: past.name,
        durationMinutes: past.durationMinutes,
        priceInr: past.priceInr,
      },
      addDaysToKey(today, -2),
      15 * 60,
      "confirmed",
    );
  }

  const cancelled = findService("design-system-foundations");
  if (cancelled) {
    push(
      "seed-design-system",
      cancelled.id,
      {
        name: cancelled.name,
        durationMinutes: cancelled.durationMinutes,
        priceInr: cancelled.priceInr,
      },
      addDaysToKey(today, 9),
      12 * 60,
      "cancelled",
    );
  }

  // Removed service — intentionally absent from data/services.ts.
  push(
    "seed-legacy-wordpress",
    "wordpress-maintenance",
    {
      name: "WordPress Maintenance Retainer",
      durationMinutes: 60,
      priceInr: 2999,
    },
    addDaysToKey(today, 4),
    16 * 60 + 30,
    "confirmed",
  );

  return seeds;
}

/** Parse + validate + repair one read. May rewrite (repair) once. */
function readAppointments(storage: Storage): LoadAppointmentsResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { appointments: [], warnings: [{ kind: "storage-unavailable" }] };
  }

  // Absent key → first run: seed exactly once, then the key exists.
  if (raw === null) {
    const seeds = buildSeedAppointments();
    const warnings: StorageWarning[] = writeAppointments(storage, seeds)
      ? []
      : [{ kind: "storage-unavailable" }];
    return { appointments: seeds, warnings };
  }

  const parsed = parseEnvelope(raw);
  if (parsed.tag === "corrupt") {
    quarantine(storage, raw);
    writeAppointments(storage, []);
    return {
      appointments: [],
      warnings: [{ kind: "corrupt-data-quarantined" }],
    };
  }

  if (parsed.tag === "unsupported-version") {
    quarantine(storage, raw);
    writeAppointments(storage, []);
    return {
      appointments: [],
      warnings: [
        { kind: "unsupported-version", foundVersion: parsed.foundVersion },
      ],
    };
  }

  const valid: Appointment[] = [];
  let droppedCount = 0;
  for (const record of parsed.records) {
    if (isStoredAppointment(record)) valid.push(record);
    else droppedCount += 1;
  }

  const warnings: StorageWarning[] =
    droppedCount > 0 ? [{ kind: "records-dropped", droppedCount }] : [];
  if (droppedCount > 0) writeAppointments(storage, valid); // durable repair

  return { appointments: valid, warnings };
}

/* ------------------------------------------------------------------------
   THE storage service — one object, the app's only persistence gateway
   ------------------------------------------------------------------------ */

export const bookingStorage = {
  /** Read + validate (+ seed on first run). Safe to call repeatedly. */
  loadAppointments(): LoadAppointmentsResult {
    const storage = getLocalStorage();
    if (storage === null) {
      return { appointments: [], warnings: [{ kind: "storage-unavailable" }] };
    }
    return readAppointments(storage);
  },

  /**
   * Check-then-commit: conflict is re-checked synchronously against the
   * freshly read list immediately before the write, so double-clicks and
   * other tabs cannot create overlapping bookings in this browser.
   * Called from user event handlers only — never from effects — so React
   * StrictMode cannot duplicate bookings.
   */
  createAppointment(
    input: NewAppointmentInput,
  ): Result<Appointment, CreateAppointmentError> {
    const service = findService(input.serviceId);
    if (service === undefined)
      return { ok: false, error: { code: "service-unavailable" } };

    const storage = getLocalStorage();
    if (storage === null)
      return { ok: false, error: { code: "storage-write-failed" } };

    const { appointments } = readAppointments(storage);
    const conflict = findConflictingAppointment(
      {
        date: input.date,
        startMinutes: input.startMinutes,
        durationMinutes: service.durationMinutes,
      },
      appointments,
    );
    if (conflict !== undefined)
      return { ok: false, error: { code: "slot-taken" } };

    const appointment: Appointment = {
      id: generateAppointmentId(),
      serviceId: service.id,
      // Snapshot: later catalogue edits can never rewrite history.
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      priceInr: service.priceInr,
      customer: { ...input.customer },
      date: input.date,
      startMinutes: input.startMinutes,
      lifecycle: "confirmed",
      createdAt: Date.now(),
      cancelledAt: null,
    };

    if (!writeAppointments(storage, [...appointments, appointment])) {
      return { ok: false, error: { code: "storage-write-failed" } };
    }
    return { ok: true, value: appointment };
  },

  /**
   * Cancels by id with eligibility re-checked at write time. Cancelled
   * appointments are retained in history and stop blocking slots (only
   * 'confirmed' records participate in the conflict rule).
   */
  cancelAppointment(id: string): Result<Appointment, CancelAppointmentError> {
    const storage = getLocalStorage();
    if (storage === null)
      return { ok: false, error: { code: "storage-write-failed" } };

    const { appointments } = readAppointments(storage);
    const target = appointments.find((appointment) => appointment.id === id);
    if (target === undefined)
      return { ok: false, error: { code: "not-found" } };

    const now = new Date();
    if (!isCancellable(target, now))
      return { ok: false, error: { code: "not-cancellable" } };

    const cancelled: Appointment = {
      ...target,
      lifecycle: "cancelled",
      cancelledAt: now.getTime(),
    };
    const next = appointments.map((appointment) =>
      appointment.id === id ? cancelled : appointment,
    );

    if (!writeAppointments(storage, next)) {
      return { ok: false, error: { code: "storage-write-failed" } };
    }
    return { ok: true, value: cancelled };
  },

  /**
   * Cross-tab sync. Browsers fire `storage` events only in tabs OTHER than
   * the writer, so this cannot loop. `event.key === null` means
   * storage.clear() — also treated as a change.
   */
  subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  },
};
