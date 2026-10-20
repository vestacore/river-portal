import { createHash } from 'node:crypto';

/** The SHA-256 of a pay key: only the hash enters the river; the key itself is shown once. */
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
