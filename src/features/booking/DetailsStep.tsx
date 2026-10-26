import { useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import type { BookingDetailsForm } from "../../types/domain";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { validateBookingDetails } from "./validation";

type DetailsStepProps = {
  details: BookingDetailsForm;
  onChange: (patch: Partial<BookingDetailsForm>) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function DetailsStep({
  details,
  onChange,
  onContinue,
  onBack,
}: DetailsStepProps) {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const errors = validateBookingDetails(details);

  const handleContinue = () => {
    setHasAttemptedSubmit(true);
    if (Object.keys(errors).length === 0) {
      onContinue();
    }
  };

  return (
    <section
      aria-labelledby="booking-details-heading"
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <h2
        id="booking-details-heading"
        className="text-base font-semibold text-text-primary"
      >
        Your details
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        We use these only to confirm and manage your appointment.
      </p>

      <div className="mt-5 grid gap-4">
        <TextField
          id="booking-details-full-name"
          label="Full name"
          type="text"
          value={details.fullName}
          onChange={(event) => onChange({ fullName: event.target.value })}
          error={hasAttemptedSubmit ? errors.fullName : undefined}
          autoComplete="name"
          placeholder="Aarav Sharma"
          maxLength={80}
        />
        <TextField
          id="booking-details-email"
          label="Email address"
          type="email"
          value={details.email}
          onChange={(event) => onChange({ email: event.target.value })}
          error={hasAttemptedSubmit ? errors.email : undefined}
          autoComplete="email"
          inputMode="email"
          placeholder="aarav@example.com"
        />
        <TextField
          id="booking-details-phone"
          label="Mobile number"
          type="tel"
          value={details.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          error={hasAttemptedSubmit ? errors.phone : undefined}
          hint="Indian mobile numbers only — a +91 or 0 prefix is fine."
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="98765 43210"
        />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          <LuArrowLeft aria-hidden /> Back to times
        </Button>
        <Button variant="primary" onClick={handleContinue}>
          Review booking
        </Button>
      </div>
    </section>
  );
}
