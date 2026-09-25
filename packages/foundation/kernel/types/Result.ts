import type { FieldError } from './FieldError.ts';

/** Outcome of validating or executing something that can fail for the user's input. */
export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };
