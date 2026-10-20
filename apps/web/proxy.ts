import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@river/identity';
import { demoSecret } from '@/lib/demoSecret';

const segments = ['en-gb', 'uk'] as const;

/**
 * The language a visitor reads, for a page asked for without one: the language they chose before (a
 * cookie), else the first language their browser prefers that the portal speaks — Ukrainian for `uk`
 * (and, as before, `ru`), English for any `en` — weighed by the browser's q-values; English otherwise.
 */
function preferredSegment(request: NextRequest): string {
  const remembered = request.cookies.get('river-locale')?.value;
  if (remembered && (segments as readonly string[]).includes(remembered)) return remembered;
  const accept = (request.headers.get('accept-language') ?? '')
    .split(',')
    .map((part, i) => { const [tag = '', ...params] = part.trim().split(';'); const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1); return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0, i }; })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of accept) {
    if (tag.startsWith('uk') || tag.startsWith('ru')) return 'uk';
    if (tag.startsWith('en')) return 'en-gb';
  }
  return 'en-gb';
}

/**
 * Runs before every page. Strips a spoofed identity header; sends a path without a language to the
 * visitor's language; establishes who is acting from the signed demo session; and keeps the cabinets for
 * people who chose a demo profile — anyone else is sent to the persona picker.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const headers = new Headers(request.headers);
  headers.delete('x-river-auth');
  const first = pathname.split('/')[1] ?? '';
  if (!(segments as readonly string[]).includes(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredSegment(request)}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }
  const secret = demoSecret();
  const claims = secret ? verifySession(request.cookies.get('river-session')?.value, secret) : null;
  if (claims) headers.set('x-river-auth', JSON.stringify({ via: 'demo', personaId: claims.personaId }));
  else if (/^\/(en-gb|uk)\/cabinet(\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/demo`;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/((?!_next/|__nextjs|favicon.ico|icon.svg|robots.txt).*)'] };
