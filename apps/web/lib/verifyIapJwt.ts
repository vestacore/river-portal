type Jwk = JsonWebKey & { kid: string };
let keyCache: { at: number; keys: Jwk[] } | null = null;

async function iapKeys(): Promise<Jwk[]> {
  if (keyCache && Date.now() - keyCache.at < 3_600_000) return keyCache.keys;
  const response = await fetch('https://www.gstatic.com/iap/verify/public_key-jwk', { cache: 'no-store' });
  if (!response.ok) throw new Error(`IAP keys: HTTP ${response.status}`);
  const { keys } = (await response.json()) as { keys: Jwk[] };
  keyCache = { at: Date.now(), keys };
  return keys;
}

const decode = (part: string) => Buffer.from(part, 'base64url');

/**
 * Verifies the signed header Identity-Aware Proxy adds (`x-goog-iap-jwt-assertion`, ES256) and
 * returns the user's e-mail, or null. Audience: exact `RIVER_IAP_AUDIENCE`, or the project prefix
 * `RIVER_IAP_AUDIENCE_PREFIX` (/projects/NUMBER/global/backendServices/) — see ADR-0010.
 */
export async function verifyIapJwt(token: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const header = JSON.parse(decode(h).toString('utf8')) as { alg?: string; kid?: string };
    const claims = JSON.parse(decode(p).toString('utf8')) as { aud?: string; iss?: string; exp?: number; iat?: number; email?: string };
    if (header.alg !== 'ES256' || !header.kid) return null;
    const jwk = (await iapKeys()).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, decode(s), new TextEncoder().encode(`${h}.${p}`));
    if (!valid) return null;
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== 'https://cloud.google.com/iap' || !claims.exp || claims.exp < now || (claims.iat ?? 0) > now + 60) return null;
    const exact = process.env.RIVER_IAP_AUDIENCE;
    const prefix = process.env.RIVER_IAP_AUDIENCE_PREFIX;
    const audienceOk = exact ? claims.aud === exact : Boolean(prefix && claims.aud?.startsWith(prefix));
    if (!audienceOk || !claims.email) return null;
    return claims.email.replace(/^accounts\.google\.com:/, '').toLowerCase();
  } catch {
    return null;
  }
}
