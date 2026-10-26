import { LuCheck, LuClock, LuX } from "react-icons/lu";
import type { IconType } from "react-icons";
import type { AppointmentStatus } from "../types/domain";

/**
 * Presentation registry for appointment status — THE extension point: adding
 * a status means extending the union in types/domain.ts and adding one entry
 * here; Record exhaustiveness forces the update and every consumer follows.
 * Status is never conveyed by color alone — label + icon are always present.
 */
export interface StatusPresentation {
  label: string;
  icon: IconType;
  /** Token-based classes applied to the Badge wrapper. */
  className: string;
}

export const APPOINTMENT_STATUS_PRESENTATION: Record<
  AppointmentStatus,
  StatusPresentation
> = {
  upcoming: {
    label: "Upcoming",
    icon: LuClock,
    className: "border-primary/25 bg-primary-soft text-primary",
  },
  completed: {
    label: "Completed",
    icon: LuCheck,
    className: "border-success/25 bg-success-soft text-success",
  },
  cancelled: {
    label: "Cancelled",
    icon: LuX,
    className: "border-border bg-surface-muted text-text-secondary",
  },
};
