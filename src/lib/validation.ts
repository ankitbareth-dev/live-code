import type {
  BookingDetailsForm,
  BookingFieldErrors,
  Result,
} from "../types/domain";

/**
 * Centralized field validation — the ONLY place booking-form rules live.
 * Rules (stated for the README):
 * - Values are trimmed; whitespace-only input counts as empty.
 * - Email: pragmatic pattern — no whitespace, one @, domain with a dot and a
 *   2+ character TLD. Full RFC 5322 compliance hurts UX more than it helps.
 * - Phone (India market): optional +91 / 0091 / 0 prefix, then exactly 10
 *   digits starting 6–9. Stored normalized: 10 digits, no prefix.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PHONE_SEPARATOR_PATTERN = /[\s().-]/g;

export function validateFullName(raw: string): Result<string, string> {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, error: "Enter your full name." };
  if (value.length < 2)
    return { ok: false, error: "Full name must be at least 2 characters." };
  return { ok: true, value };
}

export function validateEmail(raw: string): Result<string, string> {
  const value = raw.trim();
  if (value.length === 0)
    return { ok: false, error: "Enter your email address." };
  if (!EMAIL_PATTERN.test(value)) {
    return {
      ok: false,
      error: "Enter a valid email address, like name@company.com.",
    };
  }
  return { ok: true, value };
}

export function validatePhone(raw: string): Result<string, string> {
  const value = raw.trim();
  if (value.length === 0)
    return { ok: false, error: "Enter your phone number." };

  const compact = value.replace(PHONE_SEPARATOR_PATTERN, "");
  let digits = compact;
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("0091")) digits = digits.slice(4);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (!/^\d+$/.test(digits) || !INDIAN_MOBILE_PATTERN.test(digits)) {
    return {
      ok: false,
      error: "Enter a 10-digit Indian mobile number, for example 98765 43210.",
    };
  }
  return { ok: true, value: digits };
}

/** Validates every field; returns a field → message map (empty when valid).
 *  Valid input is never rewritten — callers keep raw values until submit. */
export function validateBookingDetails(
  details: BookingDetailsForm,
): BookingFieldErrors {
  const errors: BookingFieldErrors = {};
  const name = validateFullName(details.fullName);
  if (!name.ok) errors.fullName = name.error;
  const email = validateEmail(details.email);
  if (!email.ok) errors.email = email.error;
  const phone = validatePhone(details.phone);
  if (!phone.ok) errors.phone = phone.error;
  return errors;
}
