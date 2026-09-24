---
type: architecture
status: draft
tags: [architecture, stack]
aliases: [Stack, Tech Stack]
---

# Technology Stack

Chosen components, the reason for each and the main alternative considered. Back to [[Architecture Overview]].

> [!principle] Selection criteria
> Small charities must be able to run the platform cheaply at [[Scaling Tiers#Tier 1 — Spring|Tier 1]] and grow to [[Scaling Tiers#Tier 4 — Basin|Tier 4]] without migration ([[Guiding Principles#P11. Scale without changing character]]). We prefer managed, scale-to-zero Google Cloud services, one language (TypeScript) end to end, and boring, well-documented tools.

## Runtime and application

| Layer | Choice | Reason | Alternative considered |
|---|---|---|---|
| Language | **TypeScript 5.x** (strict) everywhere | Shared domain types between UI, API and projectors (`packages/domain`) | Go for the API — faster, but splits the domain model |
| Public site `web` | **Next.js (App Router), React Server Components** | Streaming SSR, ISR over public projections, strong i18n and image tooling. See [[ADR-004 Next.js on Cloud Run]] | Astro + islands (lighter, weaker for app-like flows); Nuxt |
| Staff app `studio` | **Next.js** (separate app) | Same component library; isolation behind IAP. See [[ADR-003 IAP for Staff Sections]] | One app with role-gated routes — rejected, bigger attack surface |
| Hosting | **Cloud Run** (min instances 0/1) | Container portability, scale-to-zero, IAP-compatible via serverless NEG | Firebase App Hosting — attractive, but IAP integration less direct |
| CDN / edge | **Firebase Hosting** rewrites to Cloud Run (web); **Cloud CDN** on LB (studio static assets) | Free TLS, global CDN, simple custom domains | Cloudflare — extra vendor and data-processing agreement |
| Command API `river-api` | **Node.js 22 + Fastify**, zod validation | Fast, schema-first, typed routes; runs on Cloud Run | NestJS — heavier; tRPC — couples clients to server |
| Async compute | **Cloud Functions 2nd gen** (Eventarc Firestore triggers) | Native `onDocumentCreated` for projectors; retries | Pub/Sub push to Cloud Run — used at Tier 3+ for fan-out |
| Messaging bus | **Pub/Sub** | Notifications, media pipeline, BigQuery feed | Cloud Tasks — used only for delayed jobs (reminders) |

## Data and identity

| Concern | Choice | Reason | Alternative considered |
|---|---|---|---|
| Operational store | **Cloud Firestore** (Native mode, `eur3` multi-region) | Realtime listeners for studio, serverless, strong transactions per document group. See [[ADR-002 Firebase as Content and Data Platform]] | Cloud SQL Postgres + outbox — stronger querying, higher fixed cost |
| Event log | Firestore `orgs/{orgId}/events` | One store, transactional append with projections. See [[ADR-001 Event-Sourced Append Log]] | EventStoreDB; Postgres append table |
| Analytics | **BigQuery** (streaming export, Tier 3–4) | Long-range audit queries, grant reporting | Looker Studio on Firestore — too limited |
| Files | **Cloud Storage for Firebase** | Signed uploads from mobile, Storage rules, lifecycle policies | Separate GCS bucket with signed URLs only |
| Encryption | **Cloud KMS** (per-person data keys, envelope encryption) | Enables crypto-shredding | Application-level keys in Secret Manager — weaker rotation |
| Public auth | **Firebase Authentication** (email link, phone OTP, Google, Apple) | Low friction for Olena and James | Auth0 — cost, extra processor |
| Staff auth | **Identity-Aware Proxy** + Google Workspace / Cloud Identity groups | Zero-trust staff perimeter, no passwords in app | App-level SSO — more code to get wrong |
| Secrets | **Secret Manager** | Versioned, IAM-controlled | Environment variables in CI — rejected |

## Frontend libraries

| Concern | Choice | Reason | Alternative |
|---|---|---|---|
| Styling | **Tailwind CSS** + design tokens (CSS variables) | Consistent with [[Design Language]]; themeable per organisation | CSS Modules only |
| Motion | **Framer Motion** (respecting `prefers-reduced-motion`) | Expressive, positive micro-interactions | GSAP — licence and bundle weight |
| Components | Radix UI primitives in `packages/ui` | Accessible by default ([[Accessibility]]) | MUI — heavy, hard to theme to brand |
| i18n | **next-intl** (ICU MessageFormat) | RSC support, locale routing. See [[Internationalisation]] | i18next |
| Rich content | **TipTap** (ProseMirror) block editor | Structured JSON output. See [[Content Management]] | Editor.js; headless CMS |
| Maps | MapLibre GL + vector tiles | No per-view pricing; coarse locations only. See [[Flow Map]] | Google Maps JS — cost, tracking |
| Forms | react-hook-form + zod (shared schemas) | Same validation client and server | Formik |
| Offline | Service worker (Serwist) + IndexedDB outbox | [[Help Seeker Section]] and carrier legs in poor connectivity | Native apps — rejected for Tier 1–3 |

## Integrations

| Concern | Choice | Reason |
|---|---|---|
| AI | **Vertex AI — Gemini** (EU region) | Data residency, IAM, no training on customer data. See [[Vertex AI Integration]] |
| Payments | External links: Stripe Checkout, bank transfer, Monobank jar | Card data never touches the portal; webhooks append `gift.Received`. See [[Money Flow and Cost Transparency]] |
| Email / SMS | SendGrid (or Postmark) / Twilio (or Vonage) behind an adapter | Replaceable providers. See [[Notifications]] |
| Image safety | Cloud Vision (face detection) or Vertex for optional face-blur | See [[Content Management#Media pipeline]] |

## Tooling and operations

| Concern | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo (see [[Frontend Application#Monorepo layout]]) |
| IaC | Terraform (Google provider), one state per environment |
| CI/CD | GitHub Actions (OIDC Workload Identity Federation) → Cloud Build → Cloud Deploy |
| Testing | Vitest, Playwright, Firebase Emulator Suite for rules and projectors |
| Observability | Cloud Logging, Cloud Trace (OpenTelemetry), Error Reporting, Cloud Monitoring. See [[Observability]] |

See also [[Deployment and Environments]] and [[Scaling Architecture]].
