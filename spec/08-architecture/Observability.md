---
type: architecture
status: draft
tags: [architecture, observability, sre, privacy/sensitive]
aliases: [Monitoring, SLOs, Logging]
---

# Observability

Logging without personal data, tracing, SLOs and alerting. Back to [[Architecture Overview]]. Deployment context: [[Deployment and Environments]].

> [!privacy] Operational logs are not a second database of people
> Application logs never contain names, phone numbers, emails, addresses, free text from people, tokens or IAP assertions. They carry ids (`personId`, `needId`), event types and correlation ids. The audit trail of *who did what* lives in the [[Log Event|event log]], not in Cloud Logging. See [[Data Minimisation]].

## Logging

- Structured JSON (pino) from every service, with a shared schema: `severity`, `service`, `orgId`, `correlationId`, `trace`, `commandType` / `eventType`, `actorRole`, `via`, `latencyMs`, `outcome`.
- **Redaction at source**: a pino redaction list (`*.phone`, `*.email`, `*.name`, `*.address`, `headers.authorization`, `headers["x-goog-iap-jwt-assertion"]`, `headers["x-river-access"]`, `body.description`, `body.text`) plus a CI test that feeds known PII through every route and asserts nothing matches in captured logs.
- Request bodies are never logged; validation errors log the field path and rule, not the value.
- Error Reporting groups exceptions; stack traces are scrubbed of payload values.
- Log buckets: `_Default` 30 days; `audit-access` (staff/auditor access decisions, break-glass) 400 days → 7 years at Tier 3–4; Cloud Audit Logs (Data Access) enabled for Firestore, KMS, Secret Manager.
- Sink to BigQuery (Tier 3–4) for long-range operational analysis, same PII rules.

## Tracing

OpenTelemetry in `web`, `studio`, `river-api` and functions, exported to Cloud Trace. The **correlationId** of a command is propagated as a trace attribute and stored on every resulting event, so one trace follows: browser → `river-api` → Firestore commit → projector → Pub/Sub → notifier. Sampling: 10% by default, 100% for errors and for commands in DP-relevant paths.

## SLOs

| SLI | Target (30-day) | Why it matters |
|---|---|---|
| `/ask` availability (successful page + `need.submit` accepted) | **99.9%** | The left bank must always be open ([[ADR-005 Open Access for Recipients]]) |
| `need.submit` latency p95 | < 800 ms | Olena on a weak connection |
| Command API availability (all commands) | 99.5% | Coordinators' work |
| **Projection lag** p95 (event `recordedAt` → view updated) | < 5 s; p99 < 30 s | Coordinators and public see truth quickly |
| Public page LCP p75 (CrUX / RUM) | < 2.5 s | [[Design Language]] promise, SEO |
| Notification delivery (queued → provider accepted) p95 | < 60 s | Carriers receive magic links promptly |
| Studio availability through IAP | 99.5% | Staff access |

Error budgets drive release pace: a burnt budget freezes feature deploys for that service.

## Projection lag metric

Every projector writes a custom metric on success:

```ts
// functions/projectors/src/metrics.ts
const lagMs = Date.now() - ev.recordedAt.toMillis();
meter.createHistogram('river/projection_lag_ms').record(lagMs, {
  projector: p.name, orgId: ev.orgId, eventType: ev.type,
});
```

Also tracked: `river/projection_gap_detected` (seq gaps triggering catch-up), `river/projection_retry`, `river/dlq_messages`, and a **watermark** per projector (`lastRecordedAt` applied) compared against the newest event every minute by a scheduler; a stalled watermark alerts even when no errors are thrown.

## Business-health signals (no PII)

Operational dashboards also show, per organisation: needs waiting for acknowledgement > 24 h, needs `on_hold` > 14 days, legs `departed` without hand-over > 48 h, costs awaiting approval > 7 days, consents expiring in 30 days. These feed the [[Coordinator Workspace]] and [[Admin Studio]] rather than paging engineers.

## Alerting

| Alert | Condition | Route |
|---|---|---|
| `/ask` SLO fast burn | 2% budget in 1 h | on-call engineer (page) |
| Projection lag | p95 > 30 s for 10 min, or watermark stalled 5 min | on-call |
| Event append failures | error rate > 1% for 5 min | on-call |
| Dead-letter queue | > 0 messages in `notify.*` DLQ for 15 min | on-call (ticket) |
| Break-glass use | any `system.BreakGlassUsed` | administrators + trustees ([[IAP Staff Access#Break-glass access]]) |
| Unusual `sealed` reads | > N per person per day | Safeguarding Lead ([[Safeguarding]]) |
| PII detector hit in logs | log-based metric on patterns (phone/email) > 0 | on-call + DPO |
| Vertex budget | 80% of monthly AI budget | administrator ([[Vertex AI Integration#Cost controls]]) |
| Payment webhook signature failures | > 5 in 10 min | on-call |

On-call for a small charity may be the implementation partner; alert routes are configured per organisation in Terraform.

## Real-user monitoring

Web Vitals are collected from `web` without cookies or identifiers (sampled, aggregated by route and locale) to respect [[Privacy Model]]; no third-party analytics scripts on help-seeker pages.
