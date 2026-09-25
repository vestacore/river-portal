---
type: adr
status: accepted-provisional
date: 2026-09-24
tags: [adr, edge]
spec: none
---

# ADR-0016 Default Domain via sslip.io

## Context
A Google-managed certificate needs a hostname that resolves to the load balancer. No production domain is chosen yet.

## Decision
The Pulumi stack config `river:domain` is optional. When it is empty, the domain defaults to `<ip-with-dashes>.sslip.io` (public wildcard DNS that resolves to the embedded IP), and the studio is served at `studio.<ip-with-dashes>.sslip.io`.

## Consequences
- **Positive**: working HTTPS on the first `pulumi up` without DNS work.
- **Negative**: this relies on a third-party DNS service. It is for `dev` and demos only; a real domain is set before real users arrive.

Back to [[00 ADR Home]].
