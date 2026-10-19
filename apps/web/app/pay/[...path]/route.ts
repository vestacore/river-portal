import { NextResponse, type NextRequest } from 'next/server';

const segments = ['en-gb', 'uk'];

function preferredSegment(request: NextRequest): string {
  const remembered = request.cookies.get('river-locale')?.value;
  if (remembered && segments.includes(remembered)) return remembered;
  return /\b(uk|ru)\b/i.test((request.headers.get('accept-language') ?? '').split(',')[0] ?? '') ? 'uk' : 'en-gb';
}

/**
 * Pay addresses without a language (adr/records/ADR-0025). A provider is given a return address that
 * knows nothing about the payer; the stand-in's page is addressed the same way. Here the payer's
 * language is found again, and — on the way back from a provider — the pay key kept in this
 * browser brings them to their own invoice. Only plain path segments are passed on.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.length === 0 || path.length > 4 || path.some((part) => !/^[A-Za-z0-9_.~-]{1,220}$/.test(part))) return new NextResponse('Not found', { status: 404 });
  const segment = preferredSegment(request);
  const [kept, key] = (request.cookies.get('river-pay-return')?.value ?? '').split(':');
  const to = path[0] === 'return' && path.length === 2 && kept === path[1] && key && /^[A-Za-z0-9_-]{20,128}$/.test(key)
    ? `/${segment}/pay/invoice/${key}`
    : `/${segment}/pay/${path.join('/')}`;
  // A path, not an address: behind a load balancer the server's own idea of its origin is its bind
  // address, and a redirect built from it would send the payer nowhere.
  return new NextResponse(null, { status: 303, headers: { location: to, 'cache-control': 'no-store' } });
}
