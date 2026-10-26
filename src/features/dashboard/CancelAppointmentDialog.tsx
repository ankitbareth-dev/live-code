import type { Appointment, CancelAppointmentError } from "../../types/domain";
import { formatDateShort, formatTime } from "../../lib/format";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";

const CANCEL_ERROR_MESSAGES: Record<CancelAppointmentError["code"], string> = {
  "not-found":
    "This appointment no longer exists. It may have been changed in another tab.",
  "not-cancellable":
    "This appointment can no longer be cancelled — it may already be completed or cancelled.",
  "storage-write-failed":
    "The cancellation could not be saved. Browser storage may be full or unavailable. Please try again.",
};

type CancelAppointmentDialogProps = {
  appointment: Appointment | null;
  errorCode: CancelAppointmentError["code"] | null;
  onClose: () => void;
  onConfirm: (appointment: Appointment) => void;
};

export function CancelAppointmentDialog({
  appointment,
  errorCode,
  onClose,
  onConfirm,
}: CancelAppointmentDialogProps) {
  return (
    <Dialog
      isOpen={appointment !== null}
      onClose={onClose}
      title="Cancel this appointment?"
    >
      {appointment !== null && (
        <>
          <p className="text-sm text-text-secondary">
            The{" "}
            <span className="font-medium text-text-primary">
              {appointment.serviceName}
            </span>{" "}
            session on{" "}
            <span className="font-medium text-text-primary">
              {formatDateShort(appointment.date)}
            </span>{" "}
            at{" "}
            <span className="font-medium text-text-primary">
              {formatTime(appointment.startMinutes)}
            </span>{" "}
            will be cancelled. This cannot be undone.
          </p>

          {errorCode !== null && (
            <p
              role="alert"
              className="mt-4 rounded-control border border-danger bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger"
            >
              {CANCEL_ERROR_MESSAGES[errorCode]}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Keep appointment
            </Button>
            <Button variant="danger" onClick={() => onConfirm(appointment)}>
              Cancel appointment
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
