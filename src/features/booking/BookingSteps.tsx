import { LuCheck } from "react-icons/lu";
import type { BookingStep, Service } from "../../types/domain";
import { formatDuration, formatPrice } from "../../lib/format";
import { Button } from "../../components/ui/Button";

const STEPS: ReadonlyArray<{ id: BookingStep; label: string }> = [
  { id: "date", label: "Date" },
  { id: "time", label: "Time" },
  { id: "details", label: "Your details" },
  { id: "review", label: "Review" },
];

type BookingStepsProps = {
  step: BookingStep;
  service: Service;
  onStepClick: (step: BookingStep) => void;
  onChangeService: () => void;
};

export function BookingSteps({
  step,
  service,
  onStepClick,
  onChangeService,
}: BookingStepsProps) {
  const Icon = service.icon;
  const currentIndex = STEPS.findIndex((entry) => entry.id === step);

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {service.name}
          </p>
          <p className="text-xs text-text-secondary">
            {formatDuration(service.durationMinutes)} ·{" "}
            {formatPrice(service.priceInr)}
          </p>
        </div>
        <Button
          variant="secondary"
          className="ml-auto"
          onClick={onChangeService}
        >
          Change
        </Button>
      </div>

      <ol className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        {STEPS.map((entry, index) => {
          const isCurrent = entry.id === step;
          const isDone = index < currentIndex;
          const circleClass = isDone
            ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-text-on-primary"
            : isCurrent
              ? "flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary text-primary"
              : "flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-muted";
          const labelClass = isCurrent
            ? "text-xs font-semibold text-text-primary"
            : [
                "hidden text-xs sm:block",
                isDone ? "font-medium text-text-secondary" : "text-text-muted",
              ].join(" ");

          return (
            <li
              key={entry.id}
              className={
                index === 0
                  ? "flex items-center"
                  : "flex flex-1 items-center gap-2"
              }
            >
              {index > 0 && (
                <span aria-hidden className="h-px min-w-4 flex-1 bg-border" />
              )}
              <button
                type="button"
                disabled={!isDone}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onStepClick(entry.id)}
                className="flex items-center gap-2 disabled:cursor-default"
              >
                <span className={circleClass}>
                  {isDone ? (
                    <LuCheck aria-hidden className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </span>
                <span className={labelClass}>{entry.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
