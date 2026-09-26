---
type: adr
status: accepted
date: 2026-09-26
tags: [adr, deployment, showcase]
spec: none
---

# ADR-0024 Interim Showcase on Vercel

## Context
- **The target platform is Google Cloud.** The portal is built as one Next.js image deployed as two Cloud Run services behind a load balancer with Cloud Armor and IAP. Firestore is the store and Vertex AI gives assistance. Pulumi creates all of it (ADR-0008, ADR-0009, ADR-0010, ADR-0014). That deployment has not been made yet.
- **The steward wants to show the work now.** The aim is to let people see **how and what the model built**: the running portal demo, and the almanac in `reflections/almanac`.
- **The steward's conditions:**
  - a free Vercel account (the Hobby plan);
  - **no change to the portal's code**, which stays aimed at Google Cloud.
- **The code already has a mode for this: a public sandbox** (ADR-0021). `readConfig` in `packages/compose/runtime` reads four environment variables:
  - `RIVER_SURFACE=public`: the public surface;
  - `RIVER_AUTH=demo`: demo personas instead of IAP;
  - `RIVER_DEMO_SANDBOX=1`: marks the sandbox as explicit;
  - `RIVER_SESSION_SECRET`: the sandbox's own session secret.

  In this mode the demo personas are offered, and the studio is reached by acting as a persona. Data stays in memory while `RIVER_STORE` is unset. AI suggestions use the offline fallback while `RIVER_AI` is unset.
- **`output: 'standalone'` no longer blocks Vercel.** Next.js 16.3.0 failed on Vercel when this setting was used. According to the Next.js 16.3.5 release notes, the fix was backported to that release (vercel/next.js#98167: whole-app server traces are emitted again when `output: 'standalone'` is used with an adapter). The portal uses 16.3.5.

## Decision
1. **What the site is.** A **technical interim site** with one purpose: to show how and what the model built. It is:
   - not the portal's production environment;
   - not a service for people who need help;
   - never a place for real data.

   These records, the almanac and the README say so.
2. **Two Vercel projects from one repository** (`vestacore/river-portal`, branch `main`). The steward creates and configures them in the Vercel dashboard. The model writes the steps and does not sign in to Vercel, as with Pulumi (ADR-0008).

| Project | Root Directory | Framework preset | Install | Build | Node.js |
|---|---|---|---|---|---|
| `river-portal-web` | `apps/web` | Next.js | `cd ../.. && npm ci --include=dev` | default (`npm run build` → `next build`) | 22.x |
| `river-portal-almanac` | `reflections/almanac` | Other | a no-op (`echo …`), because Vercel otherwise installs the whole workspace from the repository root | none; the folder is served as it is | — |

3. **The portal is configured only through environment variables**, the same for every environment:

| Variable | Value | Why |
|---|---|---|
| `RIVER_SURFACE` | `public` | the public surface (ADR-0010) |
| `RIVER_AUTH` | `demo` | demo personas instead of IAP (ADR-0021) |
| `RIVER_DEMO_SANDBOX` | `1` | the explicit sandbox that `readConfig` requires for demo sign-in on a public surface |
| `RIVER_SESSION_SECRET` | 48 random bytes, marked Sensitive | the local default secret is public in the repository |
| `RIVER_PROFILE` | `small-nationwide` | the profile shown on the almanac's plates |

   `RIVER_STORE`, `RIVER_AI` and the Google Cloud variables stay unset. This gives the memory store and the offline AI fallback, with no access to Google Cloud.
4. **No code change.** Nothing under `apps/`, `packages/` or `infra/` changes for Vercel. The Pulumi program remains the only description of the real deployment.
5. **The almanac tells readers what they are looking at.** It says at the top of the page that this is an interim technical site. When it is served from the web, its links to repository files open on GitHub. It asks search engines not to index it.
6. **Supply chain** (ADR-0007). Vercel installs exactly what the lockfile holds, with `npm ci --include=dev` at the repository root; the development dependencies are build tools (TypeScript, Tailwind CSS). The root `.npmrc` keeps install scripts off and engines strict. That is why the project must use Node.js 22.x: the repository requires `>=22.13 <23`, and Vercel starts new projects on 24.x.

## Consequences
- **Positive**
  - The work can be shown now, without cloud costs and without touching the target architecture.
  - The build, the proxy and the public surface are the same as on Google Cloud. Only three parts run as their demo variants: the store, the identity and the AI.
- **Negative / costs**
  - **State belongs to one instance.** Demo data lives in the memory of one Vercel Function instance:
    - it resets on a cold start and on every deployment;
    - two visitors can see different states at the same time;
    - changes that visitors make, such as switching the profile or recording a cost, may not last.
  - **None of the Google Cloud protections apply**: no Cloud Armor, no IAP and no Firestore rules. That is acceptable only because the site is a sandbox with fictional data.
  - **A realistic "Ask for help" form is public.** A real person could find it and type real details. What reduces the risk:
    - the portal calls itself a demonstration;
    - its organisations and figures are fictional;
    - anything typed stays in memory, is sent nowhere, and disappears on restart.

    Search indexing remains a follow-up.
  - **Hobby plan terms.** Personal, non-commercial use only, with limits on functions and bandwidth. An organisation that adopts the portal deploys it to its own Google Cloud project instead.
  - **Deployments follow `main`.** Every push to `main` redeploys both projects.
- **Follow-ups**
  - Record both URLs after the first deployment: in `meta/process/Interim Showcase on Vercel.md`, the README and the almanac. *Done on 2026-09-26: the portal demo at https://river-portal-web-mu.vercel.app, the almanac at https://river-portal-almanac.vercel.app.*
  - **Search indexing of the portal.** Vercel does not add `X-Robots-Tag: noindex` to production `.vercel.app` addresses. There are two ways to add it, and both wait for the steward's decision:
    - a Vercel configuration file (`vercel.json`) in `apps/web`;
    - a sandbox notice in the code.
  - **A sandbox banner in the portal.** A banner inside the portal itself, switched on by `RIVER_DEMO_SANDBOX`, would be the product-level answer. It is a code change, so it is not part of this decision.
  - **After the Google Cloud deployment**, remove the showcase or point it at the real deployment.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Deploy to Google Cloud now with Pulumi | The target, but it needs a billed project, a domain decision and the steward's time; the showcase is wanted sooner |
| Set `output` only outside Vercel in `next.config.ts` | Not needed since Next.js 16.3.5, and the steward asked for no code changes |
| Keep the Vercel settings in `apps/web/vercel.json` | Settings as code, but it adds a Vercel file to the app; the dashboard is enough for an interim site |
| Vercel Authentication on production, shared by link | Keeps the site private; the steward wants to show it openly |
| Serve the whole repository as a static site, so that the almanac's relative links work | Would publish every file as raw text; links to GitHub are clearer |

## Related
- ADR-0007 Dependency Supply-Chain Policy
- ADR-0008 Pulumi TypeScript for Infrastructure
- ADR-0010 One App, Two Surfaces
- ADR-0014 Container Builds via Cloud Build from Pulumi
- ADR-0019 Licensing and Open Publication
- ADR-0021 Identity Layer and Demo Personas
- `meta/process/Interim Showcase on Vercel.md`: the steps and their status
- `packages/compose/runtime/readConfig.ts`: how the environment selects the sandbox
