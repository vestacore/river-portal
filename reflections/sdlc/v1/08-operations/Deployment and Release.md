---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, operations, deployment]
---

# Deployment and Release

Back to [[00 SDLC Home]].

## As designed
- **Infrastructure only as code.** Pulumi (TypeScript) describes:
  - the load balancer, with Cloud Armor (preconfigured WAF rules and rate limits) and IAP;
  - two Cloud Run services;
  - Firestore, Artifact Registry and Cloud Build.

  Nothing is changed in the console (`adr/records/ADR-0008`, `ADR-0009`, `ADR-0014`).
- **The AI writes; the owner runs** `pulumi preview` and `pulumi up`.
- **Images are built by Cloud Build** from within Pulumi, and the services deploy the resulting digest.

## As observed
- A scratch preview in iteration 01 planned 34 resources and stopped only at cloud authentication.
- The owner's stack, the time of any `pulumi up` and the deployed version are **not recorded** anywhere the AI can see.
- Iteration 04 added configuration that takes effect only after the next `pulumi up`: `river-portal:profile`, and several roles per person in `staffRoles`. No step in the dialogue says "deployed".

## Gaps
- **No CI/CD.** The checks run only where the AI runs them.
- **No release log,** and no link from a commit to a deployment.
- **No smoke test after deployment,** and no observability: logs exist, but nothing watches them.

## Proposal
- One note per deployment in `meta/releases/`: commit, stack, time, configuration changes, smoke results.
- A crawl of the public routes after deployment, plus a check that `/studio` requires IAP.
- CI that runs `npm run check` and the build on every pull request.

See [[Automation Backlog]].
