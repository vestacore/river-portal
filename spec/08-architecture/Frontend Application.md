---
type: architecture
status: draft
tags: [architecture, frontend, nextjs, i18n, tier/1, open-question]
aliases: [web, studio, Frontend]
---

# Frontend Application

Two Next.js applications share one design system and one domain package: **`web`** (public portal, Firebase Auth) and **`studio`** (staff, behind IAP). Back to [[Architecture Overview]]. Decision: [[ADR-004 Next.js on Cloud Run]].

## Monorepo layout

pnpm workspaces + Turborepo; one lockfile, cached builds, affected-only CI.

```text
river-portal/
├─ apps/
│  ├─ web/                 # public Next.js app (Public Portal, Help Seeker, Giver, carrier PWA)
│  └─ studio/              # staff Next.js app (Coordinator Workspace, Admin Studio, Content Editor)
├─ services/
│  └─ river-api/           # Fastify command API (Cloud Run)
├─ functions/
│  ├─ projectors/          # Firestore-triggered projection builders
│  ├─ notifier/            # Pub/Sub → email/SMS/push
│  └─ media/               # upload pipeline: EXIF strip, renditions, face-blur
├─ packages/
│  ├─ domain/              # event types, command schemas (zod), aggregates, visibility redaction
│  ├─ ui/                  # Radix-based components, tokens, motion presets
│  ├─ i18n/                # message catalogues en-GB, uk; ICU helpers; formatters
│  ├─ blocks/              # content block schema + renderers (shared web/studio)
│  └─ config/              # eslint, tsconfig, tailwind preset
├─ infra/terraform/        # see Deployment and Environments
└─ turbo.json
```

`packages/domain` is the single source of truth: the same `NeedSubmitted` type is emitted by `river-api`, consumed by projectors and rendered by `studio`. See [[Event Catalogue]].

## `web` — route structure

```text
apps/web/app/
├─ [locale]/                       # en-GB | uk  (next-intl middleware)
│  ├─ (marketing)/page.tsx         # home, live counters (RSC + ISR)
│  ├─ campaigns/[slug]/page.tsx    # Campaign Page
│  ├─ stories/[slug]/page.tsx      # Journey Story
│  ├─ ledger/page.tsx              # Transparency Ledger
│  ├─ gratitude/page.tsx           # Gratitude Wall
│  ├─ map/page.tsx                 # Flow Map (client component, coarse geo)
│  ├─ ask/                         # Help Seeker Section — works without an account
│  │  ├─ page.tsx                  # multi-step need form (client, offline-capable)
│  │  └─ track/[token]/page.tsx    # no-account tracking link
│  ├─ give/                        # Giver Section: offers, pledges, checkout redirect
│  ├─ me/                          # signed-in area: my needs, my gifts, my reputation signals, consents
│  └─ leg/[token]/page.tsx         # carrier leg checklist (magic link, PWA)
├─ api/revalidate/route.ts         # on-demand ISR hook called by projectors
└─ sw.ts                           # service worker (Serwist)
```

Pages served: [[Public Portal]], [[Help Seeker Section]], [[Giver Section]], [[Campaign Page]], [[Journey Story]], [[Transparency Ledger]], [[Gratitude Wall]], [[Flow Map]]. See [[Site Map]].

## `studio` — route structure

```text
apps/studio/app/
├─ (workspace)/queue/              # Coordinator Workspace: needs queue, triage (DP-01)
├─ (workspace)/flows/[flowId]/     # flow board, matching (DP-04), legs (DP-05), costs (DP-06)
├─ (admin)/org/                    # Admin Studio: roles, programmes, visibility policies
├─ (admin)/audit/                  # Auditor read-only log explorer
├─ (content)/articles/[id]/edit    # Content Editor (TipTap)
├─ (content)/publications/         # Publication Pipeline, DP-09/DP-10 approvals
└─ layout.tsx                      # reads verified IAP identity, loads role scopes
```

Studio uses Firestore **realtime listeners** on `orgs/{orgId}/views/*` for the queue and flow boards (via a short-lived Firebase custom token minted by `river-api` after IAP verification, see [[IAP Staff Access]]). All mutations go to `river-api`.

## Rendering and caching

| Surface | Rendering | Cache | Invalidation |
|---|---|---|---|
| Home, campaign, story, ledger | RSC, reads `public/{orgId}/…` via the unprivileged Firestore client SDK | ISR `revalidate: 300` + CDN `s-maxage` | Projector calls `/api/revalidate` with tag (e.g. `campaign:fuel-3-convoys`) |
| Live counters | RSC shell + small client island subscribing to `public/{orgId}/stats/live` | none (listener) | realtime |
| `/ask`, `/give` forms | client components | static shell cached | build |
| `/me`, `/track/[token]` | dynamic RSC, `no-store` | never cached; `Cache-Control: private` | n/a |
| Studio | dynamic RSC + listeners | never cached at CDN | n/a |

```ts
// apps/web/app/[locale]/campaigns/[slug]/page.tsx
import { getPublicCampaign } from '@river/domain/public';
export const revalidate = 300;

export default async function CampaignPage({ params }: { params: { locale: string; slug: string } }) {
  const campaign = await getPublicCampaign(params.slug, { tags: [`campaign:${params.slug}`] });
  if (!campaign) notFound();
  return <CampaignView campaign={campaign} locale={params.locale} />; // data already redacted to `public`
}
```

> [!privacy] The public app never reads `orgs/*`
> `web` reads Firestore with the **unprivileged client SDK**, so [[Security Rules]] apply exactly as for a browser: only `public/*` is readable. Its Cloud Run service account holds no Firestore IAM role at all (verified in CI). Personal views for `/me` are fetched from `river-api`, which applies redaction for the caller. See [[Security Rules]].

## Motion and design tokens

- Tokens live in `packages/ui/tokens.ts` → emitted as CSS variables and a Tailwind preset: colour (river blues, warm sunrise accents), spacing, radius, type scale, motion durations. Organisations can override brand tokens in [[Admin Studio]]. See [[Design Language]].
- Framer Motion presets (`flowIn`, `rippleConfirm`, `tideReturn`) express the river: gentle, never frantic. All animations respect `prefers-reduced-motion` and are disabled in help-seeker flows beyond simple transitions ([[Accessibility]]).
- No countdown timers, no urgency animations ([[Brand and Tone of Voice]]).

## PWA and offline

For [[Recipient]]s like Olena and [[Carrier]]s like Mykola connectivity is intermittent.

- **Installable PWA** for `/ask`, `/track`, `/leg`.
- **Outbox pattern**: commands are queued in IndexedDB with their `idempotencyKey` and replayed by the service worker on reconnect (Background Sync where supported). Idempotency in `river-api` makes retries safe ([[Event Log and Projections#Idempotency]]).
- Photos are compressed on-device (max 1600 px, WebP) before upload; EXIF is stripped again server-side.
- Leg checklist pre-caches the leg projection and addresses of hand-over points (coarse for the next leg only).
- Low-bandwidth mode: no web fonts, no motion, text-only images, < 150 KB JS for `/ask`.

> [!question] #open-question
> How far should offline go: full offline need drafting only, or also offline delivery confirmation with deferred evidence upload? SMS fallback for need submission is also under consideration. See [[Help Seeker Section]].

## Performance budgets

| Route | LCP (4G, mid Android) | JS (gz) |
|---|---|---|
| `/ask` | < 2.0 s | < 150 KB |
| Campaign / story | < 2.5 s | < 220 KB |
| Studio queue | < 3.0 s (desktop) | n/a |

See also [[Internationalisation]], [[Multilingual Experience]], [[Identity and Access]].
