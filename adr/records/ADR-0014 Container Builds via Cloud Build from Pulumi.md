---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, delivery]
spec: none
---

# ADR-0014 Container Builds via Cloud Build from Pulumi

## Context
Docker is not installed locally, and deployment must be a single `pulumi up` by the owner.

## Decision
- Pulumi uses `@pulumi/command` to run `gcloud builds submit` with `cloudbuild.yaml` against the repository. The image is tagged with a **content hash** of the app sources, so unchanged code does not rebuild.
- Cloud Run services reference the image **by digest**.
- The `Dockerfile` is multi-stage: `npm ci --ignore-scripts` in the build stage, `next build` (standalone), then a distroless-style Node 22 runtime running as a non-root user.

## Consequences
- **Positive**: no local Docker; reproducible builds in Google Cloud.
- **Negative**: `pulumi up` takes longer when sources change. Later, CI (GitHub Actions) can build instead, with Pulumi receiving the digest.

Back to [[00 ADR Home]].
