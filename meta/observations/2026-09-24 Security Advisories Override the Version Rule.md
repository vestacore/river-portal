---
type: observation
date: 2026-09-24
tags: [observation, dependencies, security]
---

# Security Advisories Override the Version Rule

Back to [[00 Meta Home]].

**What happened.** Stepping back two minor lines gave Next.js 16.1.7 and Tiptap 3.29.2. `npm audit` then reported:
- one critical and several high advisories for every Next.js release before 16.3.3, including unauthenticated RCE in image optimisation and proxy bypasses;
- a high ReDoS in Tiptap before 3.30.5;
- moderate advisories in `uuid`, reached through firebase-admin.

**Why it matters.** The "two lines behind" rule protects against *freshly compromised* releases. It does not protect against *known* vulnerabilities in older lines. For fast-moving frameworks with many advisories, "older" can mean "known vulnerable".

**What we changed.** ADR-0007 now puts the audit first: pick two lines back, run `npm audit`, then move forward to the nearest safe patch **that is at least 7 days old** (cool-off). Only if no such patch exists do we pin a transitive dependency with `overrides`. Every exception is listed in the [[Dependency Register]].
