---
type: observation
date: 2026-09-24
tags: [observation, ui]
---

# Framework Details Found by Running the UI

Back to [[00 Meta Home]].

Running every page in the browser during iteration 01 surfaced issues that neither type checks nor unit tests catch:

- **Tailwind 4 layers.** A class defined in `@layer components` was emitted unlayered, so its `color` beat utility classes (the footer text was unreadable). Fix: base rules for rich text no longer set a colour; it is inherited.
- **CSP in development.** React needs `eval` in development only. `unsafe-eval` is added when `NODE_ENV` is not `production`.
- **The safety delay works.** The demo seed tried to publish a report 13.8 days after delivery, and the rule (14 days) refused. The seed was changed, not the rule.
- **Ukrainian needs grammar in code.** Prepositions (в/у) depend on the next word. Oblast names take cases. Numbers take three plural forms. Names inflect, so redaction must match stems ("Балаклія" → "Балаклії").
- **The first form in the document is not the one you think.** The header's edit toggle is a form too, so scripted tests must pick forms by their fields.
