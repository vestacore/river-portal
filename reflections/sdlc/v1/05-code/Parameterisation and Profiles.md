---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, code, settings, profiles]
---

# Parameterisation and Profiles

Back to [[00 SDLC Home]].

In iteration 04 the owner made the whole system configurable through a **settings registry** with **three profiles**: a state programme, a city foundation, and a small organisation working across the country. This changed the development cycle as much as the product.

## What changed in the lifecycle
- **Configuration became a reviewed artefact.** It is typed and validated (floors, ranges, contrast), recorded as events, and shown with its source (default, profile or custom). Before, it lived in constants and dictionaries.
- **The test matrix gained a dimension:**
  - 3 profiles × 2 languages = 6 variants of every text;
  - 3 profiles × 2 devices = 6 screenshot sets;
  - the seed runs for every profile in the tests.
- **Evaluation became comparative.** The same code is seen as three organisations, side by side. That is how the owner intends to test and evaluate from now on.

## What the new dimension found
- "Every pound" and "£1 to £100,000" in the dictionaries were wrong for the hryvnia profiles.
- All three home pages had the same headline, until the headline was tied to the profile's tagline.
- The same trust signal reads differently for each kind of organisation. The delivery-cost share is overhead for one and the purpose for another.
- ₴50,000 is a sensible approval limit for a national programme, but the canonical default is GBP 250. The relationship between canonical defaults and per-profile values needs to be stated explicitly.

## Costs
- Every visible string must work in six variants, and no tool checks that it does.
- A profile switch in the demo resets the data, so a custom configuration cannot be compared across profiles.
- Profiles set *parameters*, not *capabilities* (TD-21). The feature switchboard of the scaling tiers is not part of the registry yet.

## Proposal
- One command for the screenshot matrix: profile × language × device.
- A lint for currency symbols and hard-coded amounts in the dictionaries.
- Capabilities as settings, each with a default per profile and a test.
