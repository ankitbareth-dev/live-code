import type { DateKey } from "../../types/domain";
import { toDateStringKey } from "../../lib/datetime";
import { formatDateShort } from "../../lib/format";
import { SCHEDULING_POLICY } from "../../lib/schedule";
import { Button } from "../../components/ui/Button";

type DateStepProps = {
  dates: DateKey[];
  selectedDate: DateKey | null;
  now: Date;
  onSelect: (date: DateKey) => void;
  onContinue: () => void;
};

export function DateStep({
  dates,
  selectedDate,
  now,
  onSelect,
  onContinue,
}: DateStepProps) {
  const todayKey = toDateStringKey(now);

  return (
    <section
      aria-labelledby="booking-date-heading"
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="booking-date-heading"
          className="text-base font-semibold text-text-primary"
        >
          Choose a date
        </h2>
        <p className="text-xs text-text-muted">
          Mon–Fri only · up to {SCHEDULING_POLICY.maxAdvanceDays} days ahead
        </p>
      </div>

      {dates.length === 0 ? (
        <p className="mt-4 rounded-control border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          There are no bookable days in the next{" "}
          {SCHEDULING_POLICY.maxAdvanceDays} days. Please check back later.
        </p>
      ) : (
        <div
          className="mt-4 -m-1 flex gap-2 overflow-x-auto p-1"
          role="group"
          aria-label="Bookable dates"
        >
          {dates.map((date) => {
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(date)}
                className={[
                  "h-10 shrink-0 snap-start rounded-full border px-3.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-text-on-primary"
                    : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
                ].join(" ")}
              >
                {date === todayKey ? "Today" : formatDateShort(date)}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={selectedDate === null}
        >
          Continue
        </Button>
      </div>
    </section>
  );
}
