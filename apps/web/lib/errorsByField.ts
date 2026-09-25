import type { FieldError } from '@river/kernel';

/** Validation errors keyed by field, for form state. */
export function errorsByField(errors: FieldError[]): Record<string, string> {
  return Object.fromEntries(errors.map((e) => [e.field, e.code]));
}
