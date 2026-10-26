import type { Service, ServiceCategoryId } from "../../types/domain";
import { services } from "../../data/services";
import { formatDuration, formatPrice } from "../../lib/format";

const CATEGORY_LABELS: Record<ServiceCategoryId, string> = {
  development: "Development",
  design: "Design",
  strategy: "Strategy",
};

type ServiceGroup = {
  categoryId: ServiceCategoryId;
  label: string;
  services: Service[];
};

// Static catalogue → computed once at module load, in first-appearance
// order of the data file, so no separate category-order constant to maintain.
const GROUPS: ServiceGroup[] = (() => {
  const groups: ServiceGroup[] = [];
  const index = new Map<ServiceCategoryId, ServiceGroup>();
  for (const service of services) {
    const existing = index.get(service.categoryId);
    if (existing) {
      existing.services.push(service);
      continue;
    }
    const group: ServiceGroup = {
      categoryId: service.categoryId,
      label: CATEGORY_LABELS[service.categoryId],
      services: [service],
    };
    index.set(service.categoryId, group);
    groups.push(group);
  }
  return groups;
})();

type ServicePickerProps = {
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
};

export function ServicePicker({
  selectedServiceId,
  onSelect,
}: ServicePickerProps) {
  return (
    <section aria-labelledby="booking-service-heading">
      <h2
        id="booking-service-heading"
        className="text-base font-semibold text-text-primary"
      >
        Choose a service
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        One-on-one sessions with a senior consultant.
      </p>

      {GROUPS.map((group) => (
        <div key={group.categoryId} className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {group.label}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {group.services.map((service) => {
              const isSelected = service.id === selectedServiceId;
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(service.id)}
                  className={[
                    "rounded-card border bg-surface p-4 text-left shadow-card transition-colors",
                    isSelected
                      ? "border-primary"
                      : "border-border hover:border-primary",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
                      <Icon aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {service.name}
                      </p>
                      <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {formatDuration(service.durationMinutes)}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {formatPrice(service.priceInr)}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
