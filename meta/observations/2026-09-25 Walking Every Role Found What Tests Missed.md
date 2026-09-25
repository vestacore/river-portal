---
type: observation
date: 2026-09-25
tags: [observation, testing, roles]
---

# Walking Every Role Found What Tests Missed

Back to [[00 Meta Home]].

**What happened.** After iteration 04 compiled, and every unit test and the topology check passed, we walked the ten steps of the demo in a browser, as each persona and in both languages. We also crawled every route as each role. This found thirteen defects:

| # | Defect | Caught by | Fix |
|---|---|---|---|
| 1 | *Reset* on a setting did nothing: React overrides `name` on a button whose `formAction` is a function, so the key never arrived | Console error while resetting | Bind the key to the action |
| 2 | Saving a site text with a heading failed: ProseMirror keeps attributes in null-prototype objects, which a Server Action cannot receive. This also broke headings in reports | Server log after a save that showed no error | The editor sends plain JSON |
| 3 | The quick-exit button covered the header: `.chamfer` sets `position: relative`, which beat `fixed` | Screenshot as a recipient | A positioned wrapper |
| 4 | "3 kW petrol generator" was redacted to "3 kW […] generator": the stem of "Peter" (the giver) matched "petrol" | Reading the gifts list | Stems of at least four letters and endings of at most four; a regression test |
| 5 | Saving one group made every setting in it "custom", so the source labels lied | Six *Reset* buttons after one save | Unchanged values are not recorded; a test |
| 6 | In Ukrainian, the navigation squeezed the organisation's name to "Те…" at 1440 px | Screenshots of the city profile | A two-row header on every screen |
| 7 | Section numbers were fixed per component, so after reordering the home page read § 02, § 01 … | Reordering in the studio | Numbers follow the rendered order |
| 8 | A gift never reached "Thanked": the status existed, but no event set it | The giver's trace | `gift.Acknowledged` when thanks are shared (the event was already in the catalogue) |
| 9 | The walk could not be completed: the carrier had no delivery on the way, and the recipient had nothing to confirm | Step 5 of the walk | A second request for Olena and a delivery carried by Mykola; a test that the demo is walkable |
| 10 | The state programme showed "73% of money received went on delivery costs", an artefact of scaling pounds into hryvnias | Evaluating the profiles side by side | Credible amounts for that variant |
| 11 | The administrator's seven studio stages overflowed at 1440 px | Screenshot as the administrator | Equal columns without icons |
| 12 | Studio pages carried the home page's title | Browser tab | A studio title |
| 13 | "Every pound", "£1 to £100,000" and "£250" in the dictionaries were wrong for the hryvnia profiles | Reading the pages of each profile | Neutral wording, or values from settings |

**Why it matters.** None of these were type errors or logic errors inside one function. They sat at the boundaries: framework serialisation (1, 2), the cascade (3, 6, 11), data shapes meeting real words (4, 13), and a whole scenario that looked complete in parts but could not be followed from start to end (8, 9). Parameterisation multiplies the surface: a text that is right for one profile can be wrong for another (10, 13).

**What we changed.**
- A walk through every role, in both languages, is now part of the definition of done for any iteration that touches a user path.
- The seed test now checks that the demo can be walked: the carrier has a delivery on the way, and the recipient has a request to confirm.
- Screenshots of all three profiles are taken side by side before an iteration closes.
