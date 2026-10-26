import { useCallback, useState } from "react";
import type {
  BookingDetailsForm,
  BookingDraft,
  BookingStep,
  DateKey,
  MinuteOfDay,
} from "../types/domain";

const EMPTY_DETAILS: BookingDetailsForm = {
  fullName: "",
  email: "",
  phone: "",
};

const INITIAL_DRAFT: BookingDraft = {
  serviceId: null,
  date: null,
  startMinutes: null,
  details: EMPTY_DETAILS,
};

export type UseBookingDraftResult = {
  draft: BookingDraft;
  step: BookingStep;
  isPickingService: boolean;
  selectService: (serviceId: string) => void;
  openServicePicker: () => void;
  selectDate: (date: DateKey) => void;
  selectSlot: (startMinutes: MinuteOfDay) => void;
  goToStep: (step: BookingStep) => void;
  updateDetails: (patch: Partial<BookingDetailsForm>) => void;
  reset: () => void;
  clearSlot: () => void;
};

/**
 * Memory-only wizard state for the booking flow.
 *
 * Deliberately NOT persisted: customer contact details must never touch
 * localStorage before a booking is actually confirmed. Losing the draft on
 * a refresh is acceptable; leaking personal data is not.
 */
export function useBookingDraft(): UseBookingDraftResult {
  const [draft, setDraft] = useState<BookingDraft>(INITIAL_DRAFT);
  const [step, setStep] = useState<BookingStep>("date");
  const [isPickingService, setIsPickingService] = useState(false);

  const selectService = useCallback((serviceId: string) => {
    setDraft((prev) => ({
      ...prev,
      serviceId,
      // A different service can have a different duration, which changes
      // which slots fit inside opening hours — so drop any picked slot.
      startMinutes: prev.serviceId === serviceId ? prev.startMinutes : null,
    }));
    setIsPickingService(false);
    setStep("date");
  }, []);

  const openServicePicker = useCallback(() => {
    setIsPickingService(true);
  }, []);

  const selectDate = useCallback((date: DateKey) => {
    setDraft((prev) => ({
      ...prev,
      date,
      // Availability is evaluated per date — a slot picked for another
      // date is meaningless and must not survive the change.
      startMinutes: prev.date === date ? prev.startMinutes : null,
    }));
  }, []);

  const selectSlot = useCallback((startMinutes: MinuteOfDay) => {
    setDraft((prev) => ({ ...prev, startMinutes }));
  }, []);

  const clearSlot = useCallback(() => {
    setDraft((prev) => ({ ...prev, startMinutes: null }));
  }, []);

  // Trusts the caller: the UI only enables steps the current draft actually
  // supports (backward navigation, or forward once the required selection
  // exists). Keeping this guard-free avoids stale-state traps between the
  // two state updates in one event handler.
  const goToStep = useCallback((nextStep: BookingStep) => {
    setStep(nextStep);
  }, []);

  const updateDetails = useCallback((patch: Partial<BookingDetailsForm>) => {
    setDraft((prev) => ({ ...prev, details: { ...prev.details, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setStep("date");
    setIsPickingService(false);
  }, []);

  return {
    draft,
    step,
    isPickingService,
    selectService,
    openServicePicker,
    selectDate,
    selectSlot,
    goToStep,
    updateDetails,
    reset,
    clearSlot,
  };
}
