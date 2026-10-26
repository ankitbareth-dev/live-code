import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  /** Decorative icon — hidden from assistive tech, sized automatically. */
  icon?: ReactNode;
  className?: string;
}

/** Small status indicator. Text is always present; color is supplementary. */
export function Badge({ children, icon, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {icon !== undefined ? (
        <span aria-hidden="true" className="[&_svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
