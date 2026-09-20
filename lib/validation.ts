/**
 * Shared input validators — imported by BOTH the API routes (server-side,
 * authoritative) and the form components (client-side, per-field feedback).
 * Keeping one implementation means the inline error a user sees while typing
 * is exactly the error the server would have returned.
 */

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

export type FieldErrors = Record<string, string>;

/** Coerce unknown to a trimmed string capped at `max` — never throws. */
export function cleanString(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * 10–15 digits covers 0803… (11, local), 234803… (13, international) and the
 * rare foreign number, while rejecting junk like "123".
 */
export function isPhone(value: string): boolean {
  const d = phoneDigits(value);
  return d.length >= 10 && d.length <= 15;
}

export function isState(value: string): boolean {
  return NIGERIAN_STATES.includes(value);
}

/**
 * Run per-field rules against a payload. Each rule returns an error message or
 * null. This is the server twin of `validateApplication` in lib/partners.ts.
 */
export function validateFields(
  payload: Record<string, unknown>,
  rules: Record<string, (value: unknown) => string | null>,
): { ok: true } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule(payload[field]);
    if (message) errors[field] = message;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}

// ── Rule factories ─────────────────────────────────────────────────────────
// Each factory builds a `(value: unknown) => string | null` for validateFields,
// and the same factories run live in the client forms.

/** Required text; longer input is truncated to `max`, not rejected. */
export function requiredText(label: string, min = 1, max = 200) {
  return (value: unknown): string | null => {
    const s = cleanString(value, max);
    if (!s) return `${label} is required.`;
    const effectiveMin = Math.min(min, max);
    if (s.length < effectiveMin) return `${label} must be at least ${effectiveMin} characters.`;
    return null;
  };
}

/** Optional text; validated for format only when non-empty. */
export function optionalText(label: string, min = 1, max = 200) {
  return (value: unknown): string | null => {
    const s = cleanString(value, max);
    if (!s) return null;
    const effectiveMin = Math.min(min, max);
    if (s.length < effectiveMin) return `${label} must be at least ${effectiveMin} characters.`;
    return null;
  };
}

export function requiredEmail(label = "Email address") {
  return (value: unknown): string | null => {
    const s = cleanString(value, 254);
    if (!s) return `${label} is required.`;
    if (!isEmail(s)) return `${label} doesn't look right — check for typos.`;
    return null;
  };
}

export function optionalEmail(label = "Email address") {
  return (value: unknown): string | null => {
    const s = cleanString(value, 254);
    if (s && !isEmail(s)) return `${label} doesn't look right — check for typos.`;
    return null;
  };
}

export function requiredPhone(label = "Phone number") {
  return (value: unknown): string | null => {
    const s = cleanString(value, 30);
    if (!s) return `${label} is required.`;
    if (!isPhone(s)) return `${label} should be a real number, e.g. 0803 000 0000.`;
    return null;
  };
}

export function optionalPhone(label = "Phone number") {
  return (value: unknown): string | null => {
    const s = cleanString(value, 30);
    if (s && !isPhone(s)) return `${label} should be a real number, e.g. 0803 000 0000.`;
    return null;
  };
}

export function requiredState(label = "State") {
  return (value: unknown): string | null => {
    const s = cleanString(value, 40);
    if (!s) return `${label} is required.`;
    if (!isState(s)) return `Pick a ${label.toLowerCase()} from the list.`;
    return null;
  };
}
