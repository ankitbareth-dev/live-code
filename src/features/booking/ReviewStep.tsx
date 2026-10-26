import { LuArrowLeft } from "react-icons/lu";
import type {
  BookingDetailsForm,
  CreateAppointmentError,
  Customer,
  DateKey,
  MinuteOfDay,
  Service,
} from "../../types/domain";
import {
  formatDateShort,
  formatDuration,
  formatPhone,
  formatPrice,
  formatTime,
} from "../../lib/format";
import { Button } from "../../components/ui/Button";
import { resolveCustomer } from "./validation";

const CONFIRM_ERROR_MESSAGES: Record<CreateAppointmentError["code"], string> = {
  "slot-taken":
    "That time was booked by someone else a moment ago. Please choose a different slot.",
  "service-unavailable":
    "This service is no longer available. Please pick a different service.",
  "storage-write-failed":
    "Your booking could not be saved — browser storage may be full or unavailable. Please try again.",
};

type ReviewStepProps = {
  service: Service;
  date: DateKey;
  startMinutes: MinuteOfDay;
  details: BookingDetailsForm;
  confirmErrorCode: CreateAppointmentError["code"] | null;
  onConfirm: (customer: Customer) => void;
  onBack: () => void;
  onChooseNewTime: () => void;
  onChangeService: () => void;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-sm font-medium text-text-primary sm:text-right">
        {value}
      </dd>
    </div>
  );
}

export function ReviewStep({
  service,
  date,
  startMinutes,
  details,
  confirmErrorCode,
  onConfirm,
  onBack,
  onChooseNewTime,
  onChangeService,
}: ReviewStepProps) {
  const resolution = resolveCustomer(details);

  if (resolution.tag === "invalid") {
    return (
      <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-base font-semibold text-text-primary">
          Review your booking
        </h2>
        <p className="mt-2 max-w-prose text-sm text-text-secondary">
          Your contact details need attention before this booking can be
          confirmed.
        </p>
        <div className="mt-5">
          <Button variant="primary" onClick={onBack}>
            Update details
          </Button>
        </div>
      </section>
    );
  }

  const customer = resolution.customer;
  const endTime = startMinutes + service.durationMinutes;

  return (
    <section
      aria-labelledby="booking-review-heading"
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <h2
        id="booking-review-heading"
        className="text-base font-semibold text-text-primary"
      >
        Review your booking
      </h2>

      <dl className="mt-4 divide-y divide-border">
        <ReviewRow label="Service" value={service.name} />
        <ReviewRow
          label="Duration"
          value={formatDuration(service.durationMinutes)}
        />
        <ReviewRow label="Date" value={formatDateShort(date)} />
        <ReviewRow
          label="Time"
          value={`${formatTime(startMinutes)} – ${formatTime(endTime)}`}
        />
        <ReviewRow label="Price" value={formatPrice(service.priceInr)} />
        <ReviewRow label="Name" value={customer.fullName} />
        <ReviewRow label="Email" value={customer.email} />
        <ReviewRow label="Mobile" value={formatPhone(customer.phone)} />
      </dl>

      <p className="mt-4 text-sm text-text-secondary">
        Please check the details above. If plans change, you can cancel upcoming
        appointments from the dashboard.
      </p>

      {confirmErrorCode !== null && (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger bg-danger-soft p-4"
        >
          <p className="text-sm font-medium text-danger">
            {CONFIRM_ERROR_MESSAGES[confirmErrorCode]}
          </p>
          {confirmErrorCode === "slot-taken" && (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={onChooseNewTime}
            >
              Choose a new time
            </Button>
          )}
          {confirmErrorCode === "service-unavailable" && (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={onChangeService}
            >
              Change service
            </Button>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          <LuArrowLeft aria-hidden /> Back to details
        </Button>
        <Button variant="primary" onClick={() => onConfirm(customer)}>
          Confirm booking
        </Button>
      </div>
    </section>
  );
}
