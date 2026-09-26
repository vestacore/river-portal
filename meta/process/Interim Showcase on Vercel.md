---
type: process
status: active
date: 2026-09-26
tags: [process, deployment, showcase]
---

# Interim Showcase on Vercel

Back to [[00 Meta Home]]. Decision: `adr/records/ADR-0024 Interim Showcase on Vercel.md`.

> [!warning] A technical interim site
> The Vercel sites exist only to show **how and what the model built**. They are not the portal's production environment and not a service for people who need help. Everything on them is fictional demo data. The portal is built for Google Cloud (ADR-0008, ADR-0010), and its code is not changed for Vercel.

## Who does what
As with Pulumi, the model writes the steps and the steward carries them out, here in the Vercel dashboard. The model does not sign in to Vercel.

## Sites
| Site | Vercel project | Root Directory | Address | Status |
|---|---|---|---|---|
| Portal demo, public sandbox | `river-portal-web` | `apps/web` | <https://river-portal-web-mu.vercel.app> | deployed 2026-09-26 |
| Almanac | `river-portal-almanac` | `reflections/almanac` | <https://river-portal-almanac.vercel.app> | deployed 2026-09-26 |

## Steps

### 0. Before starting
- **A Vercel account on the Hobby plan.** Sign up with the GitHub account that owns `vestacore/river-portal`, which is public.
- **`main` on GitHub** holds everything to publish. Both projects deploy from it.
- **A session secret**, made locally and kept out of the repository:

```bash
openssl rand -base64 48
```

### 1. The almanac: a static site
1. **Import.** In the dashboard, choose **Add New… → Project**. Import `vestacore/river-portal`, and grant Vercel access to the repository when GitHub asks.
2. **Project Name:** `river-portal-almanac`.
3. **Root Directory:** press **Edit**, choose `reflections/almanac`.
4. **Framework Preset:** Other.
5. **Build and Output Settings:**
   - Build Command: turn **Override** on and leave the field empty. This skips the build.
   - Output Directory: leave as it is. The folder is served as it is.
   - Install Command: turn **Override** on and enter a no-op, `echo "static site: nothing to install"`. Otherwise Vercel detects the workspace and runs `npm install --prefix=../..`: it installs the whole repository, and on the default Node.js 24 it stops on the engine check.
6. **Deploy**, then open the address. The strip at the top of the page must say that this is an interim technical site.

### 2. The portal demo: Next.js
1. **Import the same repository again** (**Add New… → Project**).
2. **Project Name:** `river-portal-web` (the name used for the deployed project).
3. **Root Directory:** `apps/web`. The Framework Preset switches to **Next.js** by itself.
4. **Build and Output Settings:**
   - Install Command: **Override** on, value `cd ../.. && npm ci --include=dev`. This installs the whole workspace from the root lockfile, build tools included.
   - Build Command and Output Directory: leave as they are (`npm run build`, `.next`).
   - Node.js Version: if the import screen offers it, choose **22.x**.
5. **Environment Variables:** add these five, for all environments:

| Name | Value |
|---|---|
| `RIVER_SURFACE` | `public` |
| `RIVER_AUTH` | `demo` |
| `RIVER_DEMO_SANDBOX` | `1` |
| `RIVER_SESSION_SECRET` | the secret from step 0, marked **Sensitive** |
| `RIVER_PROFILE` | `small-nationwide` |

6. **Deploy.** If the Node.js version could not be set on the import screen, the first build stops in `npm ci` with **EBADENGINE / Unsupported engine**. This is expected: Vercel starts new projects on Node.js 24, and the repository requires 22 (`engine-strict=true` in `.npmrc`).
7. **Set Node.js 22.** Open **Settings → Build and Deployment → Node.js Version**, choose **22.x** and save. Then open **Deployments**, choose the failed deployment, and select **⋯ → Redeploy**.
8. **Check** that **Settings → Build and Deployment → Root Directory** has **Include files outside the root directory in the Build Step** switched on. It is on by default. The build needs `packages/` from the repository root.
9. **Optional:** in **Settings → Functions → Function Region**, choose **Frankfurt (fra1)**. It is closer to the portal's audience than the default in the United States.

### 3. Check
**Portal** (the project's address):
- `/` goes to `/en-gb`, and the header shows **Try as…**.
- On `/en-gb/demo/walk`, **Act as Andriy and open** leads to the studio.
- `/en-gb/studio` without a persona leads to the persona picker.
- Response headers include the Content-Security-Policy from `next.config.ts`.

**Almanac:**
- The strip at the top describes the site.
- Links to repository files open on GitHub.

### 4. Afterwards
- **Send the two addresses to the model.** They go into this note, the README and the almanac, which will then also link to the demo portal.
- **Deployment Protection:** leave the default, Standard Protection. Preview deployments then need a Vercel login, and the production address is public.
- **Automatic deployments:** every push to `main` redeploys both projects. To stop that, disconnect the repository in **Settings → Git**.

## Known limits
- **Memory state per instance.** Demo data lives in the memory of one function instance. It resets on a cold start or a deployment, and two visitors may see different states.
- **No protections of the target platform:** no Cloud Armor, no IAP, no Firestore rules. This is acceptable only because the data is fictional.
- **Search indexing.** The portal can be indexed: Vercel adds `noindex` only to preview deployments. The almanac asks not to be indexed. Whether to add `noindex` to the portal is open (ADR-0024, follow-ups).
- **Hobby plan terms:** personal, non-commercial use.

## Log
| Date | Entry |
|---|---|
| 2026-09-26 | Decision recorded (ADR-0024), steps written. Local check of the planned configuration: a production build with the same five variables, served by the standalone server. `/` redirects to `/en-gb`; the studio and "My river" redirect to the persona picker without a persona; the walk's "Act as Andriy" opens the studio; no console errors. |
| 2026-09-26 | Deployed. The portal project, imported earlier with the defaults, had failed twice at `npm install` with `EBADENGINE` (Node.js 24.21 against `>=22.13 <23`), as expected. The install command (`cd ../.. && npm ci --include=dev`), Node.js 22.x and the four variables were set in the dashboard; the steward entered `RIVER_SESSION_SECRET` as a Secret. The redeployment of `d237218` built in 58 seconds, with `output: 'standalone'` causing no trouble. The almanac project was created with the Other preset, no build and a no-op install. Checks on the live sites: `/` redirects to `/en-gb`; the studio and "My river" redirect to the persona picker; "Act as Andriy" opens the studio; the CSP and HSTS headers are present; the almanac shows the banner, asks not to be indexed and links repository files to GitHub. |
