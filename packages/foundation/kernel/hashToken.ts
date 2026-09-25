import { createHash } from 'node:crypto';

/** One-way hash of a token so that stored data never contains the token itself. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
