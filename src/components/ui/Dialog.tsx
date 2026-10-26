import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import type { KeyboardEvent, ReactNode } from "react";

export type DialogSize = "sm" | "md" | "lg";

interface DialogProps {
  isOpen: boolean;
  /** Called on Escape, backdrop press, and the close button. */
  onClose: () => void;
  /** Accessible dialog name; rendered as the panel heading. */
  title: string;
  /** Optional supporting text, wired as aria-describedby. */
  description?: string;
  size?: DialogSize;
  children: ReactNode;
}

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: portal, focus trap, Escape, backdrop close,
 * scroll lock, focus restore. The app intentionally never nests modals —
 * only one dialog can be open at a time by design. No open/close animation
 * (visual restraint; reduced-motion friendly by default).
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      const element = restoreFocusRef.current;
      if (element !== null && document.contains(element)) element.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (panel === null) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) return;

    const activeElement = document.activeElement;
    if (
      event.shiftKey &&
      (activeElement === first || !panel.contains(activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-text-primary/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      {/* my-auto (not items-center) so tall panels scroll from the top. */}
      <div className="flex min-h-full justify-center p-4 pb-safe sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={
            description !== undefined ? descriptionId : undefined
          }
          tabIndex={-1}
          className={`my-auto w-full ${SIZE_CLASSES[size]} rounded-overlay border border-border bg-surface shadow-overlay outline-none`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <h2
              id={titleId}
              className="text-base font-semibold text-text-primary"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text-primary"
            >
              <LuX aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="px-5 py-4">
            {description !== undefined ? (
              <p
                id={descriptionId}
                className="mb-4 text-sm text-text-secondary"
              >
                {description}
              </p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
