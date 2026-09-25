import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@river/identity';
import { readConfig } from '@river/runtime';
import { verifyIapJwt } from '@/lib/verifyIapJwt';

const segments = ['en-gb', 'uk'];

function preferredSegment(request: NextRequest): string {
  const remembered = request.cookies.get('river-locale')?.value;
  if (remembered && segments.includes(remembered)) return remembered;
  const accept = request.headers.get('accept-language') ?? '';
  return /\b(uk|ru)\b/i.test(accept.split(',')[0] ?? '') ? 'uk' : 'en-gb';
}

/**
 * Runs before every page (ADR-0010, ADR-0021). Strips spoofed identity headers, then establishes who
 * is acting: IAP on the studio service; a signed demo session locally or in a sandbox; nobody on the
 * public service. Studio and "my river" pages need an identity: in demo mode the visitor is sent to
 * the persona picker, otherwise they do not exist.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const config = readConfig();
  const headers = new Headers(request.headers);
  headers.delete('x-river-auth');

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredSegment(request)}${config.auth === 'iap' ? '/studio' : ''}`;
    return NextResponse.redirect(url);
  }
  const segment = pathname.split('/')[1] ?? 'en-gb';
  const protectedPath = /^\/(en-gb|uk)\/(studio|me)(\/|$)/.test(pathname);

  if (config.auth === 'iap') {
    const email = await verifyIapJwt(request.headers.get('x-goog-iap-jwt-assertion'));
    if (!email) return new NextResponse('Forbidden', { status: 403 });
    headers.set('x-river-auth', JSON.stringify({ via: 'iap', email }));
  } else if (config.auth === 'demo') {
    const claims = verifySession(request.cookies.get('river-session')?.value, config.sessionSecret);
    if (claims) headers.set('x-river-auth', JSON.stringify({ via: 'demo', personaId: claims.personaId }));
    else if (protectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = `/${segments.includes(segment) ? segment : 'en-gb'}/demo`;
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  } else if (protectedPath) {
    return new NextResponse('Not found', { status: 404 });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/((?!_next/|favicon.ico|icon.svg|robots.txt).*)'] };
