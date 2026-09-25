---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, infrastructure]
spec: spec/08-architecture/Deployment and Environments.md
---

# ADR-0008 Pulumi TypeScript for Infrastructure

## Context
The spec mentions Terraform. The owner prefers **Pulumi with TypeScript**, and **no manual changes** in Google Cloud: the owner runs `pulumi up`, and the code author writes the program.

## Decision
- `infra/` is a Pulumi TypeScript project (`@pulumi/pulumi`, `@pulumi/gcp`, `@pulumi/command`), with one stack per environment (`dev`, later `staging` and `prod`), using the existing GCS state backend.
- Everything is declared in code: API enablement, Artifact Registry, service accounts and IAM, Firestore database and rules, Cloud Run services, load balancer, Cloud Armor, IAP, certificates, secrets.
- The infrastructure code follows the same rules as application code: one resource-group function per file, a `gate.ts`.
- Changes are reviewed as diffs (`pulumi preview`) before `pulumi up`.

## Consequences
- **Positive**: the same language as the app; reproducible environments; drift is visible.
- **Negative**: some Firebase features lack Pulumi resources. Where needed we use `@pulumi/command` with `gcloud` and record the exception here.

## Related
Supersedes the Terraform mention in the spec's Deployment and Environments note.

Back to [[00 ADR Home]].
