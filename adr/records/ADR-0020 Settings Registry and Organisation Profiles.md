---
type: adr
status: accepted
date: 2026-09-25
tags: [adr, settings, configuration, profiles]
spec: spec/00-meta/Canonical Parameters.md
---

# ADR-0020 Settings Registry and Organisation Profiles

## Context
The owner asked for the whole system to be set up through a **register of settings**, with three groups of values (**profiles**) to test and evaluate against:
- a **state-level programme**;
- a **city foundation**, working in one city and its oblast;
- a **small organisation working across the country**.

Before this iteration, parameters were scattered:
- constants in code (conversion rates to GBP, the Lead Coordinator's approval limit);
- fixed texts in the dictionaries;
- a home page with a fixed set of sections.

`spec/00-meta/Canonical Parameters.md` already describes values as *per-organisation defaults with floors*, but nothing enforced them.

## Decision
- **A registry in code**, `@river/settings` (foundation, layer 0). Each `SettingDefinition` has:
  - `key`, `group`, `kind`;
  - bilingual `label` and `help`;
  - `audience`: `public` (may appear on public pages) or `team`;
  - `min`, `max` and a canonical **`floor`** that nobody can go below;
  - `choices`, or `choicesFrom` reference data (oblasts, categories);
  - `fields` for list settings;
  - `default`;
  - `editableBy`: administrator, or editor for wording and layout.
- **Registry contents.** Fourteen kinds (text, localised text, number, money, boolean, choice, multi-choice, ordered choices, numbers, entries, colour, e-mail, phone, URL) in eight groups (organisation, contact, help, giving, money, publication, home page, appearance). The registry holds about 35 settings.
- **Validation lives in the registry**: types, ranges, floors (for example a safety delay of at least 14 days) and accent-colour contrast of at least 4.5 : 1 against the ink colour.
- **Profiles** are named presets of values: `state-programme`, `city-foundation` and `small-nationwide` (the original demo organisation). Resolution order is **registry default → profile → custom value**. The resolved `SettingsSnapshot` records the **source** of each value, so the studio can show whether a value is `default`, `profile` or `custom`.
- **Stored as events** by `@river/config` in a new `steward` group (layer 2):
  - commands `applyProfile`, `changeSettings` and `resetSetting`;
  - events `settings.ProfileApplied`, `settings.ValuesChanged` and `settings.ValueReset`, with visibility `team`;
  - projection `orgs/{org}/config/settings`.
- **`changeSettings` is all or nothing.** A value equal to the one in force is not recorded, so saving a whole group does not turn every value into a custom one.
- **Every command receives the settings in force** as `CommandEnv.settings`. Domain rules read their parameters from it instead of constants: approval limit, conversion rates, reporting currency and safety delay (ADR-0023).
- **Public texts use `{{key}}` tokens**, filled from **public** settings only. For example, the home headline defaults to `{{org.tagline}}`.
- **Editing.** Settings are edited in the studio stage *Settings* (ADR-0021, ADR-0022). The form is generated from the registry by kind; fields a person may not change are shown read-only, with who can change them. An administrator can apply another profile, optionally keeping their custom values.
- **Choosing the starting profile.** Locally, `RIVER_PROFILE` chooses the profile an organisation starts from. In the cloud, the stack config `river-portal:profile` does. Later changes are made in the studio, not in configuration.

## Consequences
- **Positive**
  - One place for parameters, and floors from the specification are enforced in code.
  - Every change is on the record, with actor and capacity.
  - The three profiles make evaluation reproducible: the same code, three coherent organisations with their own demo data.
  - Adding a parameter is one definition plus its use.
- **Negative**
  - Settings are read on every request (one document, cached per request).
  - Changing the reporting currency after real money exists would mix currencies in totals. The setting's help text warns, but nothing blocks it yet (Technical Debt Register TD-16).
- **Open**
  - Profiles set *parameters*, not *capabilities*. The feature switchboard of `spec/01-business/Scaling Tiers.md` (capabilities per tier) is not yet in the registry (TD-21).

## Alternatives considered
| Option | Why not |
|---|---|
| Environment variables and config files per deployment | Not editable by staff, not recorded in the log, no validation or floors |
| A remote feature-flag or configuration service | A second system of record outside the append log; another vendor |
| Code branches or forks per organisation type | Drift between versions; evaluation would compare different code |
| Settings as free JSON edited by administrators | No validation, no floors, no bilingual labels, easy to break the public site |

Back to [[00 ADR Home]].
