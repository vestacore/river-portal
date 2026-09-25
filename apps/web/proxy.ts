import { NextResponse, type NextRequest } from 'next/server';
import { verifyIapJwt } from '@/lib/verifyIapJwt';

const segments = ['en-gb', 'uk'];

function preferredSegment(request: NextRequest): string {
  const remembered = request.cookies.get('river-locale')?.value;
  if (remembered && segments.includes(remembered)) return remembered;
  const accept = request.headers.get('accept-language') ?? '';
  return /\b(uk|ru)\b/i.test(accept.split(',')[0] ?? '') ? 'uk' : 'en-gb';
}

/**
 * Runs before every page (ADR-0010): strips spoofed identity headers, redirects `/` to a locale,
 * hides the studio on the public surface and verifies Identity-Aware Proxy on the studio surface.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const surface = process.env.RIVER_SURFACE ?? 'local';
  const headers = new Headers(request.headers);
  headers.delete('x-river-staff');

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredSegment(request)}${surface === 'studio' ? '/studio' : ''}`;
    return NextResponse.redirect(url);
  }
  const studioPath = /^\/(en-gb|uk)\/studio(\/|$)/.test(pathname);
  if (surface === 'public') {
    if (studioPath) return new NextResponse('Not found', { status: 404 });
    return NextResponse.next({ request: { headers } });
  }
  if (surface === 'studio') {
    const email = await verifyIapJwt(request.headers.get('x-goog-iap-jwt-assertion'));
    if (!email) return new NextResponse('Forbidden', { status: 403 });
    headers.set('x-river-staff', email);
  } else {
    headers.set('x-river-staff', process.env.RIVER_DEV_STAFF ?? 'dev@localhost');
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/((?!_next/|favicon.ico|icon.svg|robots.txt).*)'] };
