# River Portal Almanac

An interactive almanac of how River Portal was specified, built, checked and understood on 24–25 September 2026. It is written in the first person by the model that built it, Claude Opus 5.5, with the author of the idea as the steward of the process. It starts from development card 001 and unfolds it into ten drawing sheets.

| Sheet | Title | What you can do |
|---|---|---|
| 00 | Cover | Unfold the card into sheets |
| 01 | The river | Take the concept apart: plan and section A–A, sixteen parts |
| 02 | Timeline | Move through ten directives and seven commits, on a clock or as a story |
| 03 | The portal as built | Read fifteen annotated screenshots |
| 04 | Two working examples | Send one request down the river; run one code base as three organisations |
| 05 | How I built it | Select packages, climb the ladder of checks, filter the defects |
| 06 | How I came to understand it | Drill through the layers of understanding |
| 07 | Materials | Follow the links between everything written |
| 08 | Steward and model | See who did what, and what I would change |
| 09 | Colophon | See how the almanac was made; glossary |

## Open it

Open `index.html` in a browser. There is no build step and nothing to install. IBM Plex comes from Google Fonts; offline, the system fonts are used instead.

Links to the vaults and the code are relative to the repository, so they work when the page is opened from a checkout. To browse it over HTTP, serve the repository root:

```bash
python3 -m http.server 3200
```

Then open `http://127.0.0.1:3200/reflections/almanac/`.

The switch at the top right changes between tracing paper and blueprint. Without a choice, the page follows the system's light or dark setting.

## Online

The almanac is published on Vercel as an **interim technical site**, next to a demo copy of the portal, only to show how and what the model built (`adr/records/ADR-0024 Interim Showcase on Vercel.md`; the steps are in `meta/process/Interim Showcase on Vercel.md`). The portal itself is designed for Google Cloud, and its code is not changed for Vercel.

- The Vercel project serves this folder as it is: framework preset *Other*, no build.
- Served from the web, links to repository files open on GitHub (`almanac:repository` in `index.html`). In a checkout or on a local server they stay relative.
- A strip at the top of the page says what the site is. Once `meta.showcase.portal` in `assets/data.js` holds the demo portal's address, the strip links to it.
- The page asks search engines not to index it (`<meta name="robots" content="noindex">`).

## Where things live

| What | File |
|---|---|
| The prose of every sheet | `index.html` |
| Everything drawn, stepped or filtered: timeline, plates and their notes, both examples, packages, ladder, defects, layers of understanding, materials, glossary | `assets/data.js` |
| The figures and their behaviour | `assets/almanac.js` |
| The look: sheets, frames, tracing paper and blueprint | `assets/almanac.css` |
| Screenshots | `assets/plates/*.webp`, thumbnails in `assets/plates/thumbs/` |

The paper is not a file. It is generated in the browser from the same seed and recipe as the card's paper (`tools/cards/paper.html`), made to tile without seams.

## Editing

**A directive** on the timeline is an entry in `timeline.directives`, with its working window in `timeline.windows` and any commit in `timeline.commits`. Times are local wall-clock times (EEST, UTC+3), written without a time zone:

```js
{ m: "M11", from: "2026-09-26T10:10", to: "2026-09-26T11:02", kind: "work" }
```

**A note on a plate** is a rectangle in CSS pixels of the captured page (1280 pixels wide, or 390 for the phone), a title and a description. The numbered balloon sits at the rectangle's top-left corner:

```js
{ r: [1052, 12, 132, 40], t: "Ask for help, on every page", d: "The left bank is always open…" }
```

**A material** on sheet 07 is a node in `materials.nodes`, at a column's `x`, plus its links in `materials.edges`:

```js
["walk", "meta", "defects recorded"]
```

Two kinds of inline markup are allowed in the data: `**bold**` and `` `code` ``.

## Plates

The plates were captured from the local demo (`npm run dev`) in headless Chrome, at 1280 × 900 CSS pixels and a scale of 1.25, signed in as the demo's fictional people through the `river-session` cookie (`adr/records/ADR-0021`). The rectangles of the notes were read from the page's own elements at the same time. The images were then saved as WebP at 1600 pixels wide.

- The three home pages on sheet 04 are crops of `docs/images/profiles.png`.
- The phone plate is `docs/images/home-mobile-uk.png`.
- A single page can be captured again with `tools/design-shot.mjs`, for example:

```bash
node tools/design-shot.mjs http://localhost:3000/en-gb/transparency 1280 transparency.png --height=900 --first-screen --scale=1.25
```

The figures are those of commit `ddb01cc` and the git history up to `32213d9`. After the portal changes, update the figures in `assets/data.js` and capture the plates again.
