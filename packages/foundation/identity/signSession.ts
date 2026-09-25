import { createHmac } from 'node:crypto';
import type { SessionClaims } from './types/SessionClaims.ts';

/** A compact signed token: base64url(JSON claims) + "." + base64url(HMAC-SHA256). */
export function signSession(claims: SessionClaims, secret: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}
