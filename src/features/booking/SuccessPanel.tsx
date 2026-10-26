import { LuCheck } from "react-icons/lu";
import type { Appointment } from "../../types/domain";
import {
  formatDateShort,
  formatDuration,
  formatPhone,
  formatPrice,
  formatTime,
} from "../../lib/format";
import { Button } from "../../components/ui/Button";

type SuccessPanelProps = {
  appointment: Appointment;
  onBookAnother: () => void;
  onGoToDashboard: () => void;
};

function SuccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-sm font-medium text-text-primary sm:text-right">
        {value}
      </dd>
    </div>
  );
}

export function SuccessPanel({
  appointment,
  onBookAnother,
  onGoToDashboard,
}: SuccessPanelProps) {
  const endTime = appointment.startMinutes + appointment.durationMinutes;
  const reference = appointment.id.slice(0, 8).toUpperCase();

  return (
    <section
      aria-labelledby="booking-success-heading"
      className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <LuCheck aria-hidden className="h-6 w-6" />
      </span>
      <h2
        id="booking-success-heading"
        className="mt-4 text-xl font-semibold text-text-primary"
      >
        Appointment confirmed
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Your session is booked. We look forward to speaking with you.
      </p>

      <dl className="mt-5 divide-y divide-border border-t border-border">
        <SuccessRow label="Reference" value={reference} />
        <SuccessRow label="Service" value={appointment.serviceName} />
        <SuccessRow
          label="When"
          value={`${formatDateShort(appointment.date)}, ${formatTime(appointment.startMinutes)} – ${formatTime(endTime)}`}
        />
        <SuccessRow
          label="Duration"
          value={formatDuration(appointment.durationMinutes)}
        />
        <SuccessRow label="Price" value={formatPrice(appointment.priceInr)} />
        <SuccessRow
          label="Contact"
          value={`${appointment.customer.fullName} · ${appointment.customer.email} · ${formatPhone(appointment.customer.phone)}`}
        />
      </dl>

      <p className="mt-4 text-sm text-text-secondary">
        Need to change plans? You can cancel upcoming appointments from the
        dashboard and book a new time.
      </p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onBookAnother}>
          Book another appointment
        </Button>
        <Button variant="primary" onClick={onGoToDashboard}>
          View dashboard
        </Button>
      </div>
    </section>
  );
}
