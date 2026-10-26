import type {
  BookingDetailsForm,
  BookingFieldErrors,
  Customer,
} from "../../types/domain";

// Pragmatic email shape: something@something.tld, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indian mobile: optional +91 or 0 trunk prefix, then 10 digits starting 6-9.
const PHONE_PATTERN = /^(?:\+91|0)?([6-9]\d{9})$/;

export type CustomerResolution =
  | { tag: "valid"; customer: Customer }
  | { tag: "invalid"; errors: BookingFieldErrors };

/**
 * Normalizes free-text phone input to the bare 10-digit form the domain
 * uses ("+91 98765 43210", "09876543210", "98765-43210" -> "9876543210").
 * Returns null when the text is not a valid Indian mobile number.
 */
export function normalizePhoneNumber(rawText: string): string | null {
  const compact = rawText.replace(/[\s-]/g, "");
  const match = PHONE_PATTERN.exec(compact);
  return match?.[1] ?? null;
}

export function validateBookingDetails(
  form: BookingDetailsForm,
): BookingFieldErrors {
  const errors: BookingFieldErrors = {};

  const fullName = form.fullName.trim();
  if (fullName.length === 0) {
    errors.fullName = "Enter your full name.";
  } else if (fullName.length < 2) {
    errors.fullName = "Your name needs at least 2 characters.";
  }

  const email = form.email.trim();
  if (email.length === 0) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address, for example name@example.com.";
  }

  if (form.phone.trim().length === 0) {
    errors.phone = "Enter your mobile number.";
  } else if (normalizePhoneNumber(form.phone) === null) {
    errors.phone =
      "Enter a valid 10-digit Indian mobile number, for example 98765 43210.";
  }

  return errors;
}

/**
 * Single source of truth for turning the draft form into a domain Customer.
 * Used by the review step for display AND again inside the confirm action,
 * so the data actually written to storage can never skip validation.
 */
export function resolveCustomer(form: BookingDetailsForm): CustomerResolution {
  const errors = validateBookingDetails(form);
  if (Object.keys(errors).length > 0) {
    return { tag: "invalid", errors };
  }

  const phone = normalizePhoneNumber(form.phone);
  if (phone === null) {
    // Unreachable when validateBookingDetails passes; kept as a type guard.
    return {
      tag: "invalid",
      errors: { phone: "Enter a valid 10-digit Indian mobile number." },
    };
  }

  return {
    tag: "valid",
    customer: {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone,
    },
  };
}
