---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, operations, environments]
---

# Environments and Surfaces

Back to [[00 SDLC Home]].

| Environment | How it runs | Store | Sign-in | Used for |
|---|---|---|---|---|
| Local development | `npm run dev` (launch configuration `web`) | memory, seeded | demo personas | construction, the walk, screenshots as a persona |
| Local public surface | production build as a standalone server: `web-public` (port 3100), `web-public-state` (3101), `web-public-city` (3102) | memory, seeded per profile | none | README screenshots; evaluating each profile as a visitor |
| Cloud public | Cloud Run `river-web` behind the load balancer and Cloud Armor | Firestore | none | the public site |
| Cloud studio | Cloud Run `river-studio` behind IAP | Firestore | IAP; roles from `river-portal:staffRoles` | staff |
| Sandbox (possible) | a surface with `RIVER_AUTH=demo` and `RIVER_DEMO_SANDBOX=1` | memory or Firestore | demo personas | demonstrations |

## Configuration as guard rails
`readConfig` refuses unsafe combinations at start-up:
- the memory store on Cloud Run, unless explicitly allowed;
- a local surface on Cloud Run;
- demo sign-in with Firestore without the sandbox flag;
- demo sign-in in the cloud without a session secret.

The environment matrix is itself a product of the lifecycle. Each safety rule of the product (demo data never mixes with real data) became a check at start-up.

## The profile dimension
Every environment can start as any of the three profiles: `RIVER_PROFILE` locally, or `river-portal:profile` in the cloud. For evaluation this multiplies the environments. The launch configurations put three of them one click away.
