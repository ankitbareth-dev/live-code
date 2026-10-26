import { useEffect, useState } from "react";
import type {
  Appointment,
  CancelAppointmentError,
  CreateAppointmentError,
  Result,
} from "../types/domain";
import { makeDate } from "../lib/datetime";
import {
  bookingStorage,
  type NewAppointmentInput,
  type StorageWarning,
} from "../storage/bookingStorage";

export interface UseBookingsResult {
  /** Null until the first load completes; UI shows a loading state. */
  appointments: Appointment[] | null;
  /** Warnings from the most recent load (corruption recovery, etc.). */
  latestWarnings: StorageWarning[];
  createAppointment: (
    input: NewAppointmentInput,
  ) => Result<Appointment, CreateAppointmentError>;
  cancelAppointment: (
    id: string,
  ) => Result<Appointment, CancelAppointmentError>;
}

/** Predictable order: by start datetime, ties broken by creation time.
 *  Derived on read — never stored as a separate "sorted" state. */
function sortAppointments(appointments: readonly Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => {
    const byStart =
      makeDate(a.date, a.startMinutes).getTime() -
      makeDate(b.date, b.startMinutes).getTime();
    if (byStart !== 0) return byStart;
    return a.createdAt - b.createdAt;
  });
}

/**
 * State coordination between UI features and bookingStorage. Deliberately
 * UI-free (no toasts, no navigation): callers decide how to present results.
 */
export function useBookings(): UseBookingsResult {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [latestWarnings, setLatestWarnings] = useState<StorageWarning[]>([]);

  // Initial load + cross-tab sync. StrictMode double-invocation is safe:
  // loadAppointments is idempotent (second run finds the key present) and
  // create/cancel are never called from effects.
  useEffect(() => {
    const first = bookingStorage.loadAppointments();
    setAppointments(sortAppointments(first.appointments));
    setLatestWarnings(first.warnings);

    const unsubscribe = bookingStorage.subscribe(() => {
      const fresh = bookingStorage.loadAppointments();
      setAppointments(sortAppointments(fresh.appointments));
    });
    return unsubscribe;
  }, []);

  const createAppointment = (
    input: NewAppointmentInput,
  ): Result<Appointment, CreateAppointmentError> => {
    const result = bookingStorage.createAppointment(input);
    if (result.ok) {
      // Re-read from the source of truth rather than patching local state —
      // picks up any concurrent change in one step.
      const fresh = bookingStorage.loadAppointments();
      setAppointments(sortAppointments(fresh.appointments));
    }
    return result;
  };

  const cancelAppointment = (
    id: string,
  ): Result<Appointment, CancelAppointmentError> => {
    const result = bookingStorage.cancelAppointment(id);
    if (result.ok) {
      const fresh = bookingStorage.loadAppointments();
      setAppointments(sortAppointments(fresh.appointments));
    }
    return result;
  };

  return { appointments, latestWarnings, createAppointment, cancelAppointment };
}
