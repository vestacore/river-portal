---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, security, edge]
spec: spec/08-architecture/IAP Staff Access.md
---

# ADR-0009 Edge with Load Balancer and Cloud Armor

## Context
Cloud Armor (Standard tier, with web application firewall rules from the start) and IAP both attach to backend services of an external Application Load Balancer. Cloud Run's default URL would bypass both.

## Decision
- **Global external Application Load Balancer** with serverless network endpoint groups for each Cloud Run service. HTTP redirects to HTTPS. Google-managed certificate.
- **Cloud Armor Standard** security policy on every backend:
  - preconfigured WAF rules (OWASP CRS v3.3, sensitivity 1 at first): `sqli`, `xss`, `lfi`, `rfi`, `rce`, `methodenforcement`, `scannerdetection`, `protocolattack`, `sessionfixation`;
  - per-IP rate limiting (throttle) on the public backend, with a stricter limit on the `/ask` form endpoint;
  - JSON parsing enabled; verbose logging in `dev`.
- Cloud Run ingress is **`internal-and-cloud-load-balancing`**, so the `*.run.app` URL is unreachable from the internet.
- The studio backend has **IAP** enabled ([[ADR-0010 One App, Two Surfaces]]).

## Consequences
- **Positive**: WAF and IAP cannot be bypassed; one place for TLS and rate limits.
- **Negative**: load balancer base cost (about the price of a forwarding rule). Accepted from Tier 1.
- **Follow-up**: tune WAF rules against false positives on the rich-text save endpoints (studio), possibly per-path exclusions.

## Implementation notes (2026-09-24)
- **Rule order matters.** A throttle rule whose conform action is `allow` ends evaluation. WAF rules therefore take priorities 100–108, the POST throttle 900, the general throttle 2000, and the default allow comes last.
- **Cloud Run invoker IAM is disabled** (`invokerIamDisabled: true`) instead of binding `allUsers`. Many Workspace organisations forbid `allUsers` through the domain-restricted sharing policy. Access is enforced at the edge (ingress: load balancer only; Cloud Armor; IAP for the studio) and, for the studio, again in `proxy.ts` by verifying the IAP JWT.
- Separate policies for web and studio (`river-web-armor`, `river-studio-armor`) so they can be tuned independently.

Back to [[00 ADR Home]].
