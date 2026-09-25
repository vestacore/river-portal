---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, quality, defects]
---

# Defect Taxonomy

Back to [[00 SDLC Home]].

These are the defects recorded in `meta/` for iterations 01, 02 and 04, grouped by the boundary where each one lived. Rung numbers refer to [[The Verification Ladder]].

| Class | Defects | Found by | Could a cheaper rung have found it? | Guard to add |
|---|---|---|---|---|
| **Framework serialisation and runtime** | React overrides the `name` of a button whose `formAction` is a function, so *Reset* lost its key; ProseMirror's null-prototype attributes were rejected by Server Actions, so headings never saved; React needed `unsafe-eval` in development | Walk (6); console and server logs | No: they appear only at runtime, in a browser | An end-to-end test for every form action |
| **CSS cascade and layout** | Tailwind layer order made the footer text unreadable; a custom media rule vanished from the build; `.chamfer` beat `fixed`, so the quick exit covered the header; the organisation's name was squeezed to "Те…" in Ukrainian; seven studio stages overflowed | Screenshots (8), walk (6) | Partly: a visual regression test at fixed widths | A screenshot diff for every profile and language |
| **Data meets language** | Ukrainian inflection needed name stems; the stem of "Peter" redacted "petrol"; currency words ("every pound") in the dictionaries; quotation marks by language; plurals after tokens (TD-19) | Reading the pages (6, 8); tests after the fact | Yes: property tests for redaction; a dictionary lint | Redaction fixtures in both languages; a currency lint |
| **Scenario continuity** | A gift never reached "Thanked", because no event set that status; the demo could not be walked (no delivery on the way, nothing to confirm); the seed ran into its own safety delay | Walk (6), seed (4) | Yes: a walkability assertion, added in iteration 04 | The walk steps as tests |
| **Semantics of state** | Saving one settings group recorded every value as custom, so the source labels were wrong | Using the UI (6) | Yes: a domain test, now added | Tests that a change which alters nothing records nothing |
| **Parameterisation** | The state programme's 73% cost share (seed scaling); fixed section numbers after reordering; the same headline for every profile | Profile comparison (8) | Partly: credibility checks on seeded figures | Assertions on seeded ratios for each profile |
| **Tooling artefacts** | "Phone" screenshots cut off by a minimum window width; clicks landing during a scroll in a scripted walk | Screenshots, walk | — | Device emulation (done); scripted input |

## Pattern
None of these was a logic error inside one function, which is what unit tests are good at. **They sat at boundaries:**
- between the framework and the code;
- between CSS rules;
- between data and a human language;
- between the steps of a scenario;
- between a parameter and its meaning.

That is where the next investment in verification should go.
