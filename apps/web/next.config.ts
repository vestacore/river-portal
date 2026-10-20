import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Content Security Policy: no third-party scripts; inline styles are needed by the editor.
const csp = [
  "default-src 'self'",
  // React needs eval only in development for debugging call stacks.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: root,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    '@river/i18n', '@river/identity', '@river/stream',
    '@river/psp-facts', '@river/psp-order', '@river/psp-invoice', '@river/psp-payment', '@river/psp-session', '@river/psp-units', '@river/psp-instruments',
    '@river/psp-split', '@river/psp-ledger', '@river/psp-access', '@river/psp-contracts', '@river/psp-risk', '@river/psp-agents', '@river/psp-checkout',
    '@river/psp-integration', '@river/psp-flow', '@river/psp-views', '@river/psp-runtime',
  ],
  images: { unoptimized: true },
  experimental: { serverActions: { bodySizeLimit: '256kb' } },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default config;
