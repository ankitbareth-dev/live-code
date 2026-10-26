import { LuArrowLeft, LuLock } from "react-icons/lu";
import type { DateKey, MinuteOfDay, TimeSlot } from "../../types/domain";
import { SLOT_UNAVAILABLE_MESSAGES } from "../../lib/schedule";
import { formatDateShort, formatTime } from "../../lib/format";
import { Button } from "../../components/ui/Button";

type TimeStepProps = {
  date: DateKey;
  slots: TimeSlot[];
  selectedStartMinutes: MinuteOfDay | null;
  onSelect: (startMinutes: MinuteOfDay) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function TimeStep({
  date,
  slots,
  selectedStartMinutes,
  onSelect,
  onContinue,
  onBack,
}: TimeStepProps) {
  const availableCount = slots.filter((slot) => slot.isAvailable).length;

  return (
    <section
      aria-labelledby="booking-time-heading"
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="booking-time-heading"
          className="text-base font-semibold text-text-primary"
        >
          Choose a time
        </h2>
        <p className="text-xs text-text-muted">{formatDateShort(date)}</p>
      </div>
      <p className="mt-1 text-sm text-text-secondary">
        {availableCount} of {slots.length} times available
      </p>

      <div
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="Time slots"
      >
        {slots.map((slot) => {
          const isSelected = slot.startMinutes === selectedStartMinutes;
          const reasonText = slot.isAvailable
            ? null
            : slot.reason
              ? SLOT_UNAVAILABLE_MESSAGES[slot.reason]
              : "Not available";
          return (
            <button
              key={slot.startMinutes}
              type="button"
              disabled={!slot.isAvailable}
              aria-pressed={slot.isAvailable ? isSelected : undefined}
              title={reasonText ?? undefined}
              onClick={() => onSelect(slot.startMinutes)}
              className={[
                "flex min-h-13 flex-col items-center justify-center rounded-control border px-2 py-1.5 text-center transition-colors",
                isSelected
                  ? "border-primary bg-primary text-text-on-primary"
                  : slot.isAvailable
                    ? "border-border bg-surface text-text-primary hover:border-primary hover:bg-primary-soft"
                    : "cursor-not-allowed border-border bg-surface-muted text-text-muted",
              ].join(" ")}
            >
              <span className="text-sm font-medium">
                {formatTime(slot.startMinutes)}
              </span>
              {reasonText !== null && (
                <span className="mt-0.5 block text-[11px] leading-tight">
                  <LuLock
                    aria-hidden
                    className="mr-1 inline h-3 w-3 align-[-2px]"
                  />
                  {reasonText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          <LuArrowLeft aria-hidden /> Back to dates
        </Button>
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={selectedStartMinutes === null}
        >
          Continue
        </Button>
      </div>
    </section>
  );
}
