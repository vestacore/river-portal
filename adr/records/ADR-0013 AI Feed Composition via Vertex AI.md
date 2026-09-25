---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, ai]
spec: spec/08-architecture/Vertex AI Integration.md
---

# ADR-0013 AI Feed Composition via Vertex AI

## Context
Administrators want to turn a (private) delivery report into short public feed items with AI help, without leaking personal data and without auto-publishing.

## Decision
- Package `@river/assist` wraps **Gemini on Vertex AI** through `@google/genai` in Vertex mode, using the service account's credentials. No API keys.
- Before any prompt: the report text is passed through `redactPii` (phones, emails, exact addresses, names from the report's people list), and only `participants`-level and above fields are included.
- The model returns **structured JSON** (a schema of up to five snippets, each with en-GB and uk text, a suggested image slot and the source paragraph ids).
- Suggestions are logged as `ai.SuggestionMade` (`via: vertex`). An editor edits, accepts or rejects each snippet. Only `feed.ItemPublished` by a human makes it public.
- Without Vertex credentials (local), a deterministic **extractive fallback** produces labelled suggestions, so the flow is testable offline.

## Consequences
- **Positive**: fast, human-controlled storytelling from real records.
- **Negative**: model cost per suggestion (small). The region is set to `europe-west1` or `europe-west4` for data residency.

Back to [[00 ADR Home]].
