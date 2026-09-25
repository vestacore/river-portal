---
type: observation
date: 2026-09-24
tags: [observation, tooling, design]
---

# Screenshots Need Device Emulation

Back to [[00 Meta Home]].

**What happened.** The in-app browser pane was hidden, so screenshots failed. Headless Chrome with `--window-size=390,…` produced "phone" screenshots with content cut off on the right. That looked like a severe overflow bug, but it was an artefact: desktop Chrome enforces a minimum window width of about 500 px, lays the page out wider and then crops it.

**What we changed.** `tools/design-shot.mjs` drives headless Chrome through the DevTools Protocol with `Emulation.setDeviceMetricsOverride` (mobile flag, touch, reduced motion), captures the full page, and reports elements that extend past the viewport. With real emulation the page had no overflow; only an SVG group reached 9 px beyond the edge, and that was then fixed.

**Lesson.** Judge layouts only from emulated devices. Keep the overflow report in every design round.
