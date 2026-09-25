---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, ui, content]
spec: spec/04-form/Content Editor.md
---

# ADR-0006 In-Place Editing with Tiptap

## Context
Administrators and editors must edit content **where it appears**: headings and texts on public pages, report bodies and feed snippets. The spec asks for a simple but high-quality editor with structured JSON blocks and live data blocks.

## Decision
- **Tiptap 3.29** (headless, ProseMirror-based, MIT): `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`.
- Every editable region on a page is an **`Editable` block** with a stable block id. On the public surface it renders static, server-rendered HTML with no editor JavaScript. On the studio surface (IAP) with edit mode on, it hydrates into an inline Tiptap editor with Save and Cancel.
- Saving calls a Server Action → `editContentBlock` → event `content.BlockEdited` → projection updates the page document. The editor is loaded with `next/dynamic` only in edit mode.
- Content is stored as Tiptap JSON plus a pre-rendered sanitised HTML string per locale, so public reads need no conversion.

## Consequences
- **Positive**: WYSIWYG in context; no separate CMS; structured content suitable for AI and translation.
- **Negative**: we write a small HTML serialiser and sanitiser allow-list for the node types we enable.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Lexical | Good, but a smaller extension ecosystem for our needs |
| BlockNote | Notion-like and opinionated; heavier; may suit long-form articles later |
| Plate / Slate | More plumbing |
| Headless CMS (Sanity, Payload) | A second system of record, which conflicts with the append-log principle |

## Amendment 2026-09-24
The installed version is **3.30.6** (3.29 is affected by a ReDoS advisory). The editor bundle loads only in edit mode (`next/dynamic`, `ssr: false`), so public pages ship no editor code.

Back to [[00 ADR Home]].
