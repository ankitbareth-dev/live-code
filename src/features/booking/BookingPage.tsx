import { useState } from "react";
import type {
  Appointment,
  BookingStep,
  CreateAppointmentError,
  Customer,
} from "../../types/domain";
import type { UseBookingsResult } from "../../hooks/useBookings";
import { findService } from "../../data/services";
import { generateSlots, listSelectableDates } from "../../lib/schedule";
import { useBookingDraft } from "../../hooks/useBookingDraft";
import { BookingSteps } from "./BookingSteps";
import { DateStep } from "./DateStep";
import { DetailsStep } from "./DetailsStep";
import { ReviewStep } from "./ReviewStep";
import { ServicePicker } from "./ServicePicker";
import { SuccessPanel } from "./SuccessPanel";
import { TimeStep } from "./TimeStep";
import { usePageTitle } from "../../hooks/usePageTitle";

type BookingPageProps = {
  appointments: Appointment[] | null;
  createAppointment: UseBookingsResult["createAppointment"];
  onGoToDashboard: () => void;
};

function BookingPageHeader() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
        Book a consultation
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Choose a service, then pick a date and time that suit you.
      </p>
    </header>
  );
}

export function BookingPage({
  appointments,
  createAppointment,
  onGoToDashboard,
}: BookingPageProps) {
  usePageTitle("Book an appointment · Meridian Digital");
  const {
    draft,
    step,
    isPickingService,
    selectService,
    openServicePicker,
    selectDate,
    selectSlot,
    clearSlot,
    goToStep,
    updateDetails,
    reset,
  } = useBookingDraft();

  const [confirmedAppointment, setConfirmedAppointment] =
    useState<Appointment | null>(null);
  const [confirmErrorCode, setConfirmErrorCode] = useState<
    CreateAppointmentError["code"] | null
  >(null);

  if (confirmedAppointment !== null) {
    return (
      <div>
        <BookingPageHeader />
        <SuccessPanel
          appointment={confirmedAppointment}
          onBookAnother={() => {
            reset();
            setConfirmedAppointment(null);
          }}
          onGoToDashboard={onGoToDashboard}
        />
      </div>
    );
  }

  if (appointments === null) {
    return (
      <div>
        <BookingPageHeader />
        <p
          role="status"
          className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-secondary shadow-card"
        >
          Loading your booking options…
        </p>
      </div>
    );
  }

  const now = new Date();
  const service =
    draft.serviceId === null ? null : (findService(draft.serviceId) ?? null);
  const selectableDates = listSelectableDates(now);
  const slots =
    service !== null && draft.date !== null
      ? generateSlots({ service, dateKey: draft.date, now, appointments })
      : [];

  const handleConfirm = (customer: Customer) => {
    if (
      draft.serviceId === null ||
      draft.date === null ||
      draft.startMinutes === null ||
      service === null
    ) {
      return;
    }
    // Re-validate the chosen slot against a fresh clock and the current
    // bookings — the grid the user looked at may be stale by the time they
    // confirm. Storage performs its own check-then-commit on top of this.
    const freshSlots = generateSlots({
      service,
      dateKey: draft.date,
      now: new Date(),
      appointments,
    });
    const chosenSlot = freshSlots.find(
      (slot) => slot.startMinutes === draft.startMinutes,
    );
    if (chosenSlot === undefined || !chosenSlot.isAvailable) {
      setConfirmErrorCode("slot-taken");
      return;
    }

    const result = createAppointment({
      serviceId: draft.serviceId,
      date: draft.date,
      startMinutes: draft.startMinutes,
      customer,
    });

    if (result.ok) {
      setConfirmErrorCode(null);
      setConfirmedAppointment(result.value);
    } else {
      setConfirmErrorCode(result.error.code);
    }
  };

  const handleChooseNewTime = () => {
    setConfirmErrorCode(null);
    clearSlot();
    goToStep("time");
  };

  const handleStepClick = (nextStep: BookingStep) => {
    setConfirmErrorCode(null);
    goToStep(nextStep);
  };

  if (service === null || isPickingService) {
    return (
      <div>
        <BookingPageHeader />
        <ServicePicker
          selectedServiceId={draft.serviceId}
          onSelect={selectService}
        />
      </div>
    );
  }

  return (
    <div>
      <BookingPageHeader />
      <BookingSteps
        step={step}
        service={service}
        onStepClick={handleStepClick}
        onChangeService={() => {
          setConfirmErrorCode(null);
          openServicePicker();
        }}
      />

      <div className="mt-5">
        {step === "date" && (
          <DateStep
            dates={selectableDates}
            selectedDate={draft.date}
            now={now}
            onSelect={selectDate}
            onContinue={() => goToStep("time")}
          />
        )}

        {step === "time" && draft.date !== null && (
          <TimeStep
            date={draft.date}
            slots={slots}
            selectedStartMinutes={draft.startMinutes}
            onSelect={selectSlot}
            onContinue={() => goToStep("details")}
            onBack={() => goToStep("date")}
          />
        )}

        {step === "details" && (
          <DetailsStep
            details={draft.details}
            onChange={updateDetails}
            onContinue={() => goToStep("review")}
            onBack={() => goToStep("time")}
          />
        )}

        {step === "review" &&
          draft.date !== null &&
          draft.startMinutes !== null && (
            <ReviewStep
              service={service}
              date={draft.date}
              startMinutes={draft.startMinutes}
              details={draft.details}
              confirmErrorCode={confirmErrorCode}
              onConfirm={handleConfirm}
              onBack={() => goToStep("details")}
              onChooseNewTime={handleChooseNewTime}
              onChangeService={() => {
                setConfirmErrorCode(null);
                openServicePicker();
              }}
            />
          )}
      </div>
    </div>
  );
}
