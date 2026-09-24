---
type: adr
status: draft
tags: [adr, architecture, iap, security]
aliases: [ADR-003]
related: ["[[IAP Staff Access]]", "[[Identity and Access]]"]
---

# ADR-003 IAP for Staff Sections

**Status:** Accepted · **Date:** 2026-09-24 · Back to [[Architecture Overview]]

## Context

Staff screens ([[Coordinator Workspace]], [[Admin Studio]], [[Content Editor]]) expose `private` and `sealed` information about people in vulnerable situations ([[Safeguarding]]). A compromise of a coordinator's password or an authorisation bug in a public-facing app would be serious. Staff are a small, known group who already hold Google Workspace or Cloud Identity accounts with 2-step verification. Auditors need temporary, read-only access.

## Decision

Deploy the staff app as a **separate Next.js application (`studio`)** on Cloud Run, reachable **only** through an external HTTPS Load Balancer with **Identity-Aware Proxy** enabled. Cloud Run ingress is restricted to internal and load-balancer traffic. Both `studio` and `river-api` verify the signed `x-goog-iap-jwt-assertion` and map the Google identity to portal roles. Google groups control who passes IAP; in-app role grants (events) control what they can do. Break-glass and auditor access are defined in [[IAP Staff Access]].

## Consequences

**Positive**
- Staff surfaces are invisible to the internet without a valid staff identity; zero-trust perimeter with Google's 2SV, security keys and optional context-aware access.
- No password storage or staff login code in the portal.
- Clear separation of attack surfaces: a bug in `web` cannot expose studio routes.
- Joiners and leavers are handled in Workspace; group sync appends `role.*` events for the audit trail.

**Negative**
- Requires Google Workspace / Cloud Identity for every staff member (Cloud Identity Free covers small charities, but it is an extra account for volunteers).
- External LB adds a fixed monthly cost (~£18) even at Tier 1.
- Partner organisations' staff need guest identities, or a federated identity set-up.
- IAP is a perimeter only; authorisation must still be implemented carefully in `river-api`.

## Alternatives considered

| Alternative | Why not |
|---|---|
| Single Next.js app with role-gated `/admin` routes and Firebase Auth | Larger attack surface; staff credentials in the same auth pool as the public |
| Firebase Auth with SAML/OIDC to Workspace | Works, but routes remain internet-exposed and depend solely on app code |
| VPN for staff | Poor fit for volunteers on phones in the field |
| Third-party zero-trust proxy (Cloudflare Access) | Extra vendor and data processor; IAP is native to Cloud Run |

## Related
[[IAP Staff Access]] · [[Identity and Access]] · [[Security Rules]] · [[ADR-004 Next.js on Cloud Run]] · [[Accountability and Audit]]
