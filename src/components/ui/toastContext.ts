import { createContext, useContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Access the toast API. Throws outside a ToastProvider — fail loudly. */
export function useToasts(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error("useToasts must be used inside <ToastProvider>.");
  }
  return context;
}
