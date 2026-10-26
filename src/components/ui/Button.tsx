import type { ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-border-strong bg-surface text-text-primary hover:bg-surface-muted active:bg-surface-muted",
  danger:
    "bg-danger text-text-on-primary hover:bg-danger-hover active:bg-danger-hover",
};

const BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

/** Shared button. Focus indicator comes from the global :focus-visible rule.
 *  Defaults to type="button" — forms opt in to submit explicitly. */
export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  );
}
