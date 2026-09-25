# Tools

Small scripts that keep the repository in shape and produce its pictures. They have no dependencies beyond Node 22. The screenshot and card tools also need Google Chrome installed locally.

| Tool | What it does | Run |
|---|---|---|
| `check-topology.mjs` | Checks the package rules and keeps the generated part of `TOPOLOGY.md` current: gates, layers, one function per file, declared dependencies, no cycles | `npm run topology` · `node tools/check-topology.mjs --write` |
| `pick-version.mjs` | Picks a dependency version two minor lines behind the latest (`adr/records/ADR-0007`) | `npm run pick-version -- next react` |
| `design-shot.mjs` | Full-page screenshots with real device emulation, optionally signed in as a demo person | `node tools/design-shot.mjs http://localhost:3000/en-gb 1440 home.png --reduce` |
| `cards/build-card.mjs` | Builds a development card, a one-page PDF, from a data file | `npm run card -- reflections/cards/001.json` |

## Development cards

A development card is one A4 sheet, landscape, drawn like a technical drawing on sandy tracing paper. It records how one task was built with one model: measured figures, observations on code generation, the model's own notes, where defects surfaced, and a timeline. Card 001 is *River Portal × Claude Opus 5.5*.

### Where things live

| What | File | Edit it to |
|---|---|---|
| **Content** of a card | `reflections/cards/001.json` | change any text, figure, defect count or timeline mark |
| The PDF | `reflections/cards/Development Card 001 — River Portal × Claude Opus 5.5.pdf` (the name comes from `"output"`) | nothing: it is generated |
| **Layout and drawing** | `tools/cards/template.html` | move or resize boxes, or change type, colours, the frame and the compass constructions |
| **Paper** | `tools/cards/paper.jpg`, made by `tools/cards/paper.html` | change the paper (see [Paper](#paper)) |
| Builder | `tools/cards/build-card.mjs` | — |

### Rebuild

```bash
npm run card -- reflections/cards/001.json
```

- **Output.** The PDF is written next to the data file, under the name in `"output"`.
- **Chrome.** The builder expects Google Chrome at the default macOS path. On another system, set `CHROME` to the browser's path.
- **Fonts.** IBM Plex comes from Google Fonts, so the build needs network access.
- **Warnings.** If a text box overflows, or the fonts do not load, the builder prints a warning and exits with code 1. It still writes the files, so you can look at the result.

Options:

```bash
npm run card -- reflections/cards/001.json --png
```

`--png` also writes a preview image next to the PDF. Give it a path to put the preview elsewhere:

```bash
npm run card -- reflections/cards/001.json --png=/tmp/card-001.png
```

`--out` writes a draft PDF somewhere else, leaving the committed one alone:

```bash
node tools/cards/build-card.mjs reflections/cards/001.json --out=/tmp/draft.pdf
```

On Linux:

```bash
CHROME=/usr/bin/google-chrome node tools/cards/build-card.mjs reflections/cards/001.json
```

### Editing a card

All text and figures are in the JSON file. Two kinds of inline markup are allowed:
- `**bold**` for bold text;
- `` `mono` `` for the monospaced face.

A table cell whose whole value is in backticks, such as `` "`reflections/sdlc/v1`" ``, is set entirely in mono.

**Change a figure** in the measured band (`measured.items`; ten fit across the sheet):

```json
{ "value": "26", "caption": "unit tests; ~60 type checks, 48 test runs, 8 builds" }
```

```json
{ "value": "155", "unit": "k", "caption": "words of specification, decisions and process notes" }
```

**Add an observation** to `observations.items`, which holds up to eight. Start each one with a bold lead:

```json
"**Wide, guarded edits.** Not one interactive edit in the main thread. …"
```

**Mark the timeline** (`timeline`). Times are local wall-clock times, written `YYYY-MM-DDTHH:MM` with no time zone. The axis starts at `start` and runs for `hours`; widen `hours` if a new mark falls past the end. Where two labels crowd each other, `dx` shifts a label left or right, in millimetres.

```json
"directives": [ …, { "at": "2026-09-26T10:05", "label": "M9", "dx": 1.5 } ],
"windows":    [ …, { "from": "2026-09-26T10:10", "to": "2026-09-26T11:02", "kind": "work" } ],
"commits":    [ …, { "at": "2026-09-26T12:40", "label": "abc1234", "anchor": "end" } ]
```

`kind` is `work` (a solid bar) or `reflection` (an outlined bar). `away` hatches a stretch of time, `span` draws the dimension line, and `caption` is the line under the chart.

**Record defects on the ladder** (`ladder.rungs`, bottom rung first). `found` draws a bar. When nothing was found, `note` is printed after the "0". `strong` sets the rung's name in dark ink.

```json
{ "name": "6 walk", "found": 9 },
{ "name": "7 crawl", "found": 0, "note": "matrix as designed", "strong": true }
```

The remaining fields:

| Field | Holds |
|---|---|
| `output`, `documentTitle` | The PDF's file name (relative to the data file), and the title stored in the PDF |
| `kicker`, `title`, `subtitle` | The header. A `title` of two parts is joined by a red × |
| `identity` | Rows of `[label, value]` for the table at the top right; five fit |
| `task` | `heading`, `paragraphs`, an optional `epigraph` (`text`, `source`, and `after`, the paragraph it follows), `stack` |
| `ownWords` | `heading` and `quotes` for the taped sheet; six fit |
| `nextTime` | `heading`, `items` (check boxes) and a `note` |
| `titleBlock` | `name`, `line`, and rows of `[label, value]` |

The template adds the section numbers (§ 01–05) and the timeline's legend.

### A new card

```bash
cp reflections/cards/001.json reflections/cards/002.json
```

In the new file, change:
- `output`;
- the card number in `kicker`, `documentTitle` and `titleBlock.line`;
- the content itself.

Then build it with a preview:

```bash
npm run card -- reflections/cards/002.json --png
```

### Layout

Each box sits at a fixed position, in millimetres, in `tools/cards/template.html`. Each text box also carries a `data-fit` name, which the overflow warnings use. For example, the "observations" box is at `left:96.8mm; top:71.5mm`, 100.5 × 78.5 mm.

The drawing is SVG in the same file, at 1 unit = 1 mm. It covers:
- the grid;
- the sheet frame with zones 1–8 and A–F;
- the compass constructions;
- the dimension lines;
- Fig. 1 (the timeline) and Fig. 2 (the ladder).

To check a layout change, rebuild with `--png` and look at the preview.

### Paper

```bash
node tools/cards/build-card.mjs --paper
```

This regenerates `tools/cards/paper.jpg` in Chrome from `tools/cards/paper.html`. The texture has a warm base, cloudy mottling, grain, fibres and sand speckles. The generator is seeded, so the same seed gives the same sheet, byte for byte, in the same Chrome. `--base` sets the paper's base colour as RGB:

```bash
node tools/cards/build-card.mjs --paper --seed=7 --base=236,226,204
```

The defaults are `--seed=1925 --base=232,217,187`, a sandy tone. After changing the paper, rebuild the cards.
