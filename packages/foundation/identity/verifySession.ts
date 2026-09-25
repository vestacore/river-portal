import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SessionClaims } from './types/SessionClaims.ts';

/** The claims of a valid, unexpired token (default 12 hours), or null. Constant-time comparison. */
export function verifySession(token: string | undefined, secret: string, maxAgeSeconds = 43_200): SessionClaims | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', secret).update(body).digest();
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionClaims;
    if (typeof claims.personaId !== 'string' || typeof claims.iat !== 'number') return null;
    if (Date.now() / 1000 - claims.iat > maxAgeSeconds) return null;
    return claims;
  } catch {
    return null;
  }
}
