import type { ComponentPropsWithoutRef } from "react";

interface TextFieldProps extends ComponentPropsWithoutRef<"input"> {
  id: string;
  label: string;
  /** Field-level validation message — rendered and wired to the input. */
  error?: string | undefined;
  /** Optional static hint; hidden while an error is shown. */
  hint?: string;
}

const BASE_INPUT_CLASSES =
  "h-11 w-full rounded-control border bg-surface px-3 text-sm text-text-primary placeholder:text-text-disabled transition-colors duration-150";

export function TextField({
  id,
  label,
  error,
  hint,
  className = "",
  ...inputProps
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    error !== undefined ? errorId : hint !== undefined ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={`${BASE_INPUT_CLASSES} ${
          error !== undefined
            ? "border-danger"
            : "border-border hover:border-border-strong focus:border-primary"
        } ${className}`}
      />
      {hint !== undefined && error === undefined ? (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
      {error !== undefined ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
