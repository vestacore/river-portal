---
type: process
status: stable
tags: [process, dependencies, security]
---

# Dependency Register

Every **direct** dependency, the version chosen and why. Policy: ADR-0007 (two minor lines behind latest, exact pins, installs only through `sfw`, no install scripts). Checked on 2026-09-24; `npm audit` reports **0 vulnerabilities**. Back to [[00 Meta Home]].

| Package | Version | Latest at choice | Rule applied | Why we need it | Used in |
|---|---|---|---|---|---|
| next | **16.3.5** | 16.3.6 | **Exception (advisory)**: every 16.1 and 16.2 release is affected by critical RCE advisories fixed only in ≥ 16.3.3. We took the nearest safe patch at least 7 days old; 16.3.6 was 2 days old | UI framework | apps/web |
| react, react-dom | 19.1.9 | 19.3.0 | Two lines back | UI runtime | apps/web |
| @tiptap/react, starter-kit, pm, core | **3.30.6** | 3.31.3 | **Exception (advisory)**: 3.29 is affected by a ReDoS (fixed in ≥ 3.30.5). 3.30.6 is the latest patch of the next line and 24 days old. All `@tiptap/*` are pinned through `overrides` | In-place editor | apps/web |
| tailwindcss, @tailwindcss/postcss | 4.1.18 | 4.3.3 | Two lines back | Styling | apps/web (dev) |
| @types/react, @types/react-dom | 19.1.17 / 19.1.11 | 19.3.0 | Two lines back | Types | apps/web (dev) |
| typescript | 5.9.3 | 7.0.2 | Two lines back across majors (7.0 → 6.0 → 5.9) | Type checking | root (dev) |
| @types/node | 22.18.13 | 26.6.2 | Follows the runtime major (Node 22), two lines back within it | Types | root (dev) |
| firebase-admin | 14.3.0 | 14.5.0 | Two lines back | Firestore driver | @river/store |
| @google/genai | 2.22.0 | 2.24.0 | Two lines back | Vertex AI (Gemini) | @river/assist |
| @pulumi/pulumi | 3.262.0 | 3.264.0 | Two lines back | Infrastructure as code | infra |
| @pulumi/gcp | 9.35.1 | 9.37.0 | Two lines back | Google Cloud resources | infra |
| @pulumi/command | 1.0.5 | 1.2.1 | Two lines back | Runs Cloud Build from Pulumi | infra |

## Transitive pins (`overrides`)

| Package | Pinned | Reason |
|---|---|---|
| uuid | 11.1.1 | Moderate advisory in < 11.1.1, reached through firebase-admin → @google-cloud/storage. firebase-admin 14.5.0 fixes it but was 1 day old |
| @tiptap/* | 3.30.6 | Keeps every Tiptap package on one audited version; the caret ranges would otherwise pull 3.31.x |

## Deliberately not added
- **next-intl**: own small i18n (ADR-0017).
- **zod**: validation functions per command.
- **jose / google-auth-library** (direct): the IAP JWT is verified with Web Crypto (`apps/web/lib/verifyIapJwt.ts`).
- **framer-motion**: CSS animations and View Transitions are enough for now.
- **postcss** (direct): Tailwind brings it; the rule would have picked a 2021 line.

## Supply-chain gaps (tracked)
- The Docker build runs `npm ci` from the lockfile (integrity-checked, `--ignore-scripts`) but not through `sfw`. See [[Technical Debt Register]] TD-09.
- Pulumi provider plugins (gcp, command) are downloaded by the Pulumi CLI, not through `sfw`. TD-10.
