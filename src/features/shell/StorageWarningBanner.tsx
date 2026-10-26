import { useState } from "react";
import type { UseBookingsResult } from "../../hooks/useBookings";
import { Button } from "../../components/ui/Button";

// Keyed by warning code from bookingStorage; unknown codes fall back to
// the generic message so a new code can never crash the shell.
const STORAGE_WARNING_MESSAGES: Record<string, string> = {
  "corrupt-data-quarantined":
    "Saved booking data was damaged and has been reset. A backup of the damaged data was kept, but previous bookings may be missing.",
  "unsupported-version":
    "Saved booking data was written by a newer version of this app and could not be loaded. Previous bookings may be missing.",
  "records-dropped": "Some saved bookings could not be read and were skipped.",
  "storage-unavailable":
    "Browser storage is unavailable, so bookings cannot be saved or loaded right now.",
};

type StorageWarningBannerProps = {
  warnings: UseBookingsResult["latestWarnings"];
};

export function StorageWarningBanner({ warnings }: StorageWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // The banner owns its dismissal; it lives above the view switch in App,
  // so it never remounts and the dismissal survives view changes.
  if (warnings.length === 0 || isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-5 rounded-card border border-warning bg-warning-soft p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          {warnings.map((warning, index) => (
            <p key={index} className="text-sm text-text-primary">
              {STORAGE_WARNING_MESSAGES[warning.kind] ??
                "Your saved booking data may be affected."}
            </p>
          ))}
        </div>
        <Button variant="secondary" onClick={() => setIsDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
