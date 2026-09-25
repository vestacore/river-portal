---
type: adr
status: accepted
date: 2026-09-25
tags: [adr, ui, content, studio]
spec: spec/04-form/Content Editor.md
supersedes: ADR-0006 (in part)
---

# ADR-0022 Editing in the Studio, Not on Public Pages

## Context
ADR-0006 introduced **in-place editing**: on the studio surface, with an edit toggle, public pages turned into editable regions. The owner then asked for blocks and parts of the site to be configurable **through the UI in the admin part**, with **no editing on the public part**.

## Decision
- **Public pages carry no editing code, toggles or editor JavaScript.** Every site text is rendered on the server from the block registry, with `{{key}}` tokens filled from public settings (ADR-0020).
- **Texts are edited in Studio → Publishing (Surface) → Site texts:**
  - a list of every block, grouped by page, with a preview and a mark for texts that differ from the default;
  - an editor per block, with both languages in tabs, the tokens it may use with their current values, a rendered preview of both languages, and a link to where the text appears on the site.
- **The block registry** has two parts: `siteBlocks` (home, ask, give, footer) and `pageBlocks` (about, the four policies, questions and answers). Defaults are written once with tokens, so one text serves every profile.
- **Page structure lives in settings**, not in code. The home page's sections and their order, the doors, the trust items, the counters and the number of feed items are all settings, and section numbers (§ 01, § 02 …) follow the order chosen.
- **Unchanged from ADR-0006:** Tiptap as the editor, and storage as Tiptap JSON plus server-rendered, allow-listed HTML (`content.BlockEdited`).
- **Found while testing.** ProseMirror keeps node attributes in null-prototype objects, which a Server Action cannot receive. A heading arrived as a temporary client reference and saving failed. The editor now sends plain JSON. This also fixes the report editor.

## Consequences
- **Positive**
  - The public bundle is smaller and simpler.
  - No editing surface exists on the public site.
  - Editing follows the same role checks as every other studio action.
  - The layout of the home page can be changed without a deployment.
- **Negative**
  - Editors lose true in-context editing. The preview and the "view on the site" link reduce but do not remove the gap.
  - Block labels in the list are English only (TD-18).

## Alternatives considered
| Option | Why not |
|---|---|
| Keep the in-place toggle on the studio surface | Against the owner's instruction; editing code would ship with public page components |
| A page builder with drag-and-drop blocks | Much more code; free layouts break the drafting-table rhythm and accessibility |
| A headless CMS | A second system of record outside the log (see ADR-0006) |

Back to [[00 ADR Home]].
