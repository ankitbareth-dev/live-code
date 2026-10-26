import type {
  Appointment,
  AppointmentStatus,
  DateKey,
} from "../../types/domain";
import { daysBetweenKeys } from "../../lib/datetime";
import {
  formatDateShort,
  formatDuration,
  formatPhone,
  formatPrice,
  formatTime,
} from "../../lib/format";
import { Button } from "../../components/ui/Button";

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  upcoming: "bg-primary-soft text-primary",
  completed: "bg-success-soft text-success",
  cancelled: "bg-surface-muted text-text-secondary",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDayLabel(dateKey: DateKey, todayKey: DateKey): string {
  const dayDelta = daysBetweenKeys(todayKey, dateKey);
  if (dayDelta === 0) return "Today";
  if (dayDelta === 1) return "Tomorrow";
  if (dayDelta === -1) return "Yesterday";
  if (dayDelta > 1) return `In ${dayDelta} days`;
  return `${-dayDelta} days ago`;
}

type AppointmentCardProps = {
  appointment: Appointment;
  status: AppointmentStatus;
  isCancellable: boolean;
  todayKey: DateKey;
  onCancel: (appointment: Appointment) => void;
};

export function AppointmentCard({
  appointment,
  status,
  isCancellable,
  todayKey,
  onCancel,
}: AppointmentCardProps) {
  const endTime = appointment.startMinutes + appointment.durationMinutes;

  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">
            {appointment.serviceName}
          </h3>
          <p className="mt-1.5 text-sm text-text-secondary">
            {formatDateShort(appointment.date)} ·{" "}
            {formatTime(appointment.startMinutes)} – {formatTime(endTime)} ·{" "}
            {formatDuration(appointment.durationMinutes)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
            <span>
              {appointment.customer.fullName} ·{" "}
              {formatPhone(appointment.customer.phone)}
            </span>
            <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
              {formatDayLabel(appointment.date, todayKey)}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_BADGE_CLASSES[status],
            ].join(" ")}
          >
            {STATUS_LABELS[status]}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {formatPrice(appointment.priceInr)}
          </span>
          {isCancellable && (
            <Button
              variant="secondary"
              onClick={() => onCancel(appointment)}
              aria-label={`Cancel ${appointment.serviceName} on ${formatDateShort(appointment.date)}`}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
