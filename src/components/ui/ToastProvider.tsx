import { useCallback, useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import type { ReactNode } from "react";
import {
  ToastContext,
  type ToastInput,
  type ToastVariant,
} from "./toastContext";

interface ActiveToast extends ToastInput {
  id: number;
}

const TOAST_DURATION_MS = 6000;
const MAX_VISIBLE_TOASTS = 3;

const ACCENT_CLASSES: Record<ToastVariant, string> = {
  success: "border-l-success",
  error: "border-l-danger",
  info: "border-l-primary",
};

/**
 * Toast host. Announcements: success/info use role="status" (polite), errors
 * use role="alert" (assertive). Rendered last inside the provider so it can
 * overlay any page. Toasts are capped; oldest disappear first.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  const dismissToast = useCallback((id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput): void => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      setToasts((current) => [
        ...current.slice(-(MAX_VISIBLE_TOASTS - 1)),
        { ...toast, id },
      ]);
      const timer = window.setTimeout(
        () => dismissToast(id),
        TOAST_DURATION_MS,
      );
      timersRef.current.push(timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-card border border-l-4 bg-surface p-4 shadow-overlay ${ACCENT_CLASSES[toast.variant]}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">
                {toast.title}
              </p>
              {toast.description !== undefined ? (
                <p className="mt-0.5 text-sm text-text-secondary">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text-primary"
            >
              <LuX aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
