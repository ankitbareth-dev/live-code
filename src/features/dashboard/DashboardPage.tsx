import { useState } from "react";
import type {
  Appointment,
  AppointmentStatus,
  CancelAppointmentError,
} from "../../types/domain";
import type { UseBookingsResult } from "../../hooks/useBookings";
import { getAppointmentStatus, isCancellable } from "../../lib/schedule";
import { toDateStringKey } from "../../lib/datetime";
import { Button } from "../../components/ui/Button";
import { AppointmentCard } from "./AppointmentCard";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import { usePageTitle } from "../../hooks/usePageTitle";

const FILTER_TABS: ReadonlyArray<{ id: AppointmentStatus; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const EMPTY_STATE_MESSAGES: Record<
  AppointmentStatus,
  { title: string; description: string }
> = {
  upcoming: {
    title: "No upcoming appointments",
    description: "Book a consultation and it will show up here.",
  },
  completed: {
    title: "No completed appointments",
    description:
      "Sessions move here automatically once their end time has passed.",
  },
  cancelled: {
    title: "No cancelled appointments",
    description: "Cancelled bookings are kept here for your records.",
  },
};

// DateKeys are 'YYYY-MM-DD', so lexicographic order is chronological order.
function compareByStartAsc(a: Appointment, b: Appointment): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
  return a.createdAt - b.createdAt;
}

type DashboardPageProps = {
  appointments: Appointment[] | null;
  cancelAppointment: UseBookingsResult["cancelAppointment"];
  onBookNew: () => void;
};

export function DashboardPage({
  appointments,
  cancelAppointment,
  onBookNew,
}: DashboardPageProps) {
  usePageTitle("Appointments · Meridian Digital");
  const [statusFilter, setStatusFilter] =
    useState<AppointmentStatus>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelErrorCode, setCancelErrorCode] = useState<
    CancelAppointmentError["code"] | null
  >(null);

  if (appointments === null) {
    return (
      <p
        role="status"
        className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-secondary shadow-card"
      >
        Loading your appointments…
      </p>
    );
  }

  const now = new Date();
  const todayKey = toDateStringKey(now);

  // Status is derived on every render from the clock — it is never stored,
  // so a completed session moves tabs on its own with no writes anywhere.
  const decorated = appointments.map((appointment) => ({
    appointment,
    status: getAppointmentStatus(appointment, now),
  }));

  const counts: Record<AppointmentStatus, number> = {
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const entry of decorated) {
    counts[entry.status] += 1;
  }

  const visibleEntries = decorated
    .filter((entry) => entry.status === statusFilter)
    .sort((a, b) =>
      statusFilter === "upcoming"
        ? compareByStartAsc(a.appointment, b.appointment)
        : compareByStartAsc(b.appointment, a.appointment),
    );

  const handleCancelConfirm = (target: Appointment) => {
    const result = cancelAppointment(target.id);
    if (result.ok) {
      setCancelTarget(null);
      setCancelErrorCode(null);
    } else {
      setCancelErrorCode(result.error.code);
    }
  };

  const handleCancelDialogClose = () => {
    setCancelTarget(null);
    setCancelErrorCode(null);
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Appointments
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track upcoming sessions and review past ones.
        </p>
      </header>

      <div
        className="flex gap-1 rounded-control border border-border bg-surface-muted p-1"
        role="group"
        aria-label="Filter appointments by status"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = tab.id === statusFilter;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setStatusFilter(tab.id)}
              className={[
                "rounded-control px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {tab.label}
              <span className="ml-1.5 text-xs font-normal text-text-muted">
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3">
        {visibleEntries.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center">
            <h2 className="text-sm font-semibold text-text-primary">
              {EMPTY_STATE_MESSAGES[statusFilter].title}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
              {EMPTY_STATE_MESSAGES[statusFilter].description}
            </p>
            {statusFilter === "upcoming" && (
              <Button variant="primary" className="mt-4" onClick={onBookNew}>
                Book an appointment
              </Button>
            )}
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <AppointmentCard
              key={entry.appointment.id}
              appointment={entry.appointment}
              status={entry.status}
              isCancellable={isCancellable(entry.appointment, now)}
              todayKey={todayKey}
              onCancel={setCancelTarget}
            />
          ))
        )}
      </div>

      <CancelAppointmentDialog
        appointment={cancelTarget}
        errorCode={cancelErrorCode}
        onClose={handleCancelDialogClose}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
