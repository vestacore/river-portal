---
type: measurement
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, code, metrics]
---

# Code Measurements 2026-09-25

Back to [[00 SDLC Home]]. Measured at commit `ddb01cc`, over tracked TypeScript, JavaScript-module and CSS files. "Exported values" counts exported functions and constants, outside tests.

| Area | Files | Lines | Test files | Test lines | Type files | Data files | Data lines | Exported values |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| foundation/kernel | 10 | 79 | 1 | 10 | 2 | 0 | 0 | 6 |
| foundation/i18n | 18 | 209 | 1 | 25 | 4 | 1 | 30 | 14 |
| foundation/privacy | 7 | 101 | 1 | 31 | 2 | 0 | 0 | 5 |
| foundation/identity | 9 | 104 | 1 | 27 | 3 | 0 | 0 | 6 |
| foundation/settings | 31 | 882 | 1 | 55 | 10 | 3 | 438 | 22 |
| record/store | 9 | 216 | 1 | 18 | 4 | 0 | 0 | 3 |
| record/log | 11 | 177 | 1 | 27 | 6 | 0 | 0 | 3 |
| river/needs | 27 | 498 | 1 | 46 | 12 | 1 | 15 | 17 |
| river/gifts | 24 | 313 | 0 | 0 | 12 | 0 | 0 | 14 |
| river/flows | 32 | 613 | 1 | 57 | 11 | 0 | 0 | 22 |
| steward/config | 9 | 140 | 1 | 35 | 1 | 0 | 0 | 6 |
| assist/assist | 8 | 141 | 0 | 0 | 4 | 0 | 0 | 4 |
| surface/content | 21 | 841 | 2 | 35 | 5 | 2 | 574 | 13 |
| surface/reports | 18 | 337 | 0 | 0 | 5 | 0 | 0 | 13 |
| surface/feed | 14 | 208 | 0 | 0 | 3 | 0 | 0 | 11 |
| surface/pages | 13 | 307 | 0 | 0 | 6 | 0 | 0 | 6 |
| compose/runtime | 24 | 748 | 1 | 52 | 6 | 2 | 257 | 18 |
| **17 packages** | **285** | **5,914** | **13** | **418** | **98** | **9** | **1,314** | **183** |
| apps/web | 110 | 5,133 | 0 | 0 | — | — | — | 122 |
| infra | 14 | 387 | 0 | 0 | 2 | — | — | 17 |
| tools | 3 | 267 | 0 | 0 | — | — | — | — |
| **Total** | **412** | **11,701** | **13** | **418** | | | | |

## Derived figures
- **Library code without tests or data:** 4,182 lines. Tests amount to 10% of it.
- **The web app has no tests** for 5,133 lines. Its biggest files are the two dictionaries (210 lines each), the studio's Server Actions (196) and "My river" (192).
- **Largest data files**, all bilingual content: page texts (510 lines), profile texts (287), demo variants (232).
- **Tests over time:** 15 after iteration 01, 26 after iteration 04.
- **Direct external dependencies:** 18 packages. Iteration 04 added none.

## Documentation at the same commit
| Vault | Notes | Words | Wikilinks |
|---|---:|---:|---:|
| `spec/` | 146 | 138,283 | 4,714 |
| `adr/` | 25 (23 records) | 8,277 | 58 |
| `meta/` | 20 | 9,171 | 50 |

## Commits
See [[Commit Style]] and [[Change Size and Shape]].
