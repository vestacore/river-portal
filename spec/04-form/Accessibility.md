---
type: form
status: draft
tags: [form, accessibility, wcag, plain-language, i18n]
aliases: [a11y, Доступність]
related: ["[[Design Language]]", "[[Help Seeker Section]]", "[[Multilingual Experience]]"]
---

# Accessibility

The portal must work for Olena on an old Android phone in a village with one bar of signal, for a screen-reader user in Leeds, and for a coordinator in a moving van. Back to [[Portal Q&A]].

> [!principle]
> The left bank is always open ([[Guiding Principles#P3. The left bank is always open]]). An inaccessible form is a closed door, so accessibility defects on `/ask` and `/track` are treated as severity-1 bugs.

## Standard

- **WCAG 2.2 level AA** for both `web` and `studio`, in every enabled locale. We also meet selected AAA criteria on help-seeker pages: 1.4.6 enhanced contrast for body text, 2.4.9 link purpose and 3.1.5 reading level.
- It is checked with automated tests (axe-core in CI on every route of the [[Site Map]]), manual keyboard and screen-reader passes before each release, and **annual testing with real users**, including older Ukrainian speakers and people with low literacy.
- Relevant WCAG 2.2 additions: 2.4.11 focus not obscured (sticky mobile action bar), 2.5.7 dragging alternatives (flow canvas and triage board have "Move to…" menus), 2.5.8 target size ≥ 24 px (we use 48 px on `web`), 3.3.7 redundant entry (the form never asks twice) and 3.3.8 accessible authentication (email link or OTP, no puzzles, no CAPTCHA on `/ask`).

## Plain language

| Audience | Target | How |
|---|---|---|
| Help-seeker flow | Reading age about 9 (en-GB); comparable simple Ukrainian | Short sentences (≤ 15 words), one idea per sentence, everyday words, no jargon or acronyms |
| Giver and public pages | Reading age about 12 | Plain English, numbers with context |
| Studio | Professional, but plain | Consistent terms from the [[Glossary]] |

- Status messages are written as what happens next, not as system states ([[Help Seeker Section#Status page in plain words]]).
- The Content Editor's plain-language check flags long sentences and hard words ([[Content Editor]]).
- Native Ukrainian writers check plain-language copy. A translation of simple English is not automatically simple Ukrainian. See [[Multilingual Experience]].

## Older users and low digital confidence

- 18 px base text in help flows, with a text-size control (A / A+ / A++) that is remembered on the device.
- Large pictogram tiles with words, never icons alone.
- No timeouts on forms. Drafts are saved after each step.
- Always a **phone number** and **SMS** alternative, stated on every help-seeker page.
- "Someone else can fill this in for you" is a first-class path (on behalf of).
- Error messages say what to do: "Please add a phone number or email so we can reply", not "Invalid input".

## Screen readers and keyboard

- Semantic HTML first: landmarks, headings in order, real `<button>` and `<label>` elements. ARIA is used only where HTML is not enough.
- Live counters announce politely and are throttled, so that screen-reader users are not interrupted by ticking numbers.
- Journey timelines expose an ordered list ("Step 3 of 5: carried, completed").
- Maps and charts have text alternatives and a table view ([[Design Language#Data visualisation]]).
- Focus is visible (2 px river-600 outline + offset), in a logical order and never trapped. Modals return focus.
- `lang` attributes are set per block. Mixed-language content (a Ukrainian thank-you quote on an English page) is marked with `lang="uk"` so it is pronounced correctly.
- Tested with TalkBack (Android), VoiceOver (iOS/macOS) and NVDA (Windows).

## Cyrillic and script

- Fonts have full Ukrainian coverage (ґ, є, і, ї, apostrophe ʼ). See [[Design Language#Typography]].
- Search and autocomplete are case- and apostrophe-insensitive, and accept Latin transliteration ("Kharkiv" finds «Харків»).
- Voice input is supported in Ukrainian and English, and in other languages where the device supports them.
- Layouts tolerate strings 25–40 % longer than English. No text is baked into images.

## Low bandwidth

| Measure | Target |
|---|---|
| `/ask` first load | ≤ 150 KB transferred, usable on 2G/EDGE |
| JavaScript on `/ask`, `/track` | Progressive enhancement: works with JS disabled |
| Images | Optional. AVIF/WebP renditions sized per viewport. Placeholders are blurred colour, not spinners |
| Fonts | Subset per locale. Low-data mode uses system fonts |
| Motion and maps | Disabled in low-data mode. The map becomes a list |
| Low-data mode | Auto-enabled on `Save-Data` header or `navigator.connection.effectiveType` ≤ 3g, with a manual toggle |
| Fallbacks | SMS to submit or check status. Printed QR codes at partner points link to `/ask` |

Uploads (receipts, thanks photos) are compressed on the device and resumable. The carrier leg page queues actions while offline ([[Leg]]).

## Cognitive and emotional accessibility

- Calm design: no countdowns, no flashing, no guilt. See [[Brand and Tone of Voice]].
- Content warnings are shown before stories that mention loss or injury, and those stories are collapsed by default.
- **Quick exit** on help-seeker pages for people in unsafe situations ([[Safeguarding]]).
- Predictable layout: the same step structure every time, and a visible "Step 2 of 4".

## Accountability

An accessibility statement at `/about/accessibility` in every locale lists known issues, the test date and a contact route. Accessibility regressions block release of `/ask` and `/track`. See [[Deployment and Environments]].
