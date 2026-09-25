# Security policy

River Portal is a **research preview**. Do not use it with real personal data until the hard gates in `meta/process/Technical Debt Register.md` are closed (TD-01 per-person encryption; TD-08 delayed public aggregates).

## Reporting a vulnerability
Please report vulnerabilities **privately** through GitHub: **Security → Report a vulnerability** on this repository. Do not open a public issue.

Include what you found, how to reproduce it and what impact you expect. We will acknowledge your report and keep you informed while we fix it.

## Scope and design notes
- Public pages are server-rendered; all writes are server-side commands; Firestore denies all client access.
- The studio is reachable only through Identity-Aware Proxy, and the app verifies the IAP JWT again.
- Cloud Armor (OWASP CRS 3.3 rules and rate limits) protects both surfaces (ADR-0009).
- Dependencies follow a supply-chain policy (ADR-0007): installs through Socket Firewall, exact pins, no install scripts.
