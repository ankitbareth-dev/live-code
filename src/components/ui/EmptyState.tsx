import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Decorative icon — hidden from assistive tech. */
  icon?: ReactNode;
  /** Call to action, usually a Button. */
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      {icon !== undefined ? (
        <div
          aria-hidden="true"
          className="mb-3 [&_svg]:size-8 text-text-disabled"
        >
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description !== undefined ? (
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
      {action !== undefined ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
