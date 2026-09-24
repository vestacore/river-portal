---
type: privacy
status: draft
tags: [privacy, ethics, charter, vertex, open-question]
aliases: [Charter, Code of Ethics, Clear Water Charter]
related: ["[[Guiding Principles]]", "[[Safeguarding]]", "[[Recognition Anti-Patterns]]"]
---

# Ethics Charter

The full ethical code of an organisation running the River Portal and of the platform itself. [[Guiding Principles]] are the short form; this charter is what staff, volunteers, carriers, partners and sponsors agree to. Breaches are handled through [[Escalation and Disputes]]. Back to [[Privacy Model]].

> [!principle] Why a charter, not just rules
> Code can enforce visibility levels. It cannot enforce kindness, honesty or restraint. The charter names what we expect of people, so that the system and the people pull in the same direction.

## 1. A gift is a gift, not a commodity

- A gift is given freely and received freely. Nothing is bought: not priority, not visibility, not gratitude, not a photograph of a grateful person.
- Recognition is for **taking part**, never for the **amount**. There are no donor tiers named after metals, no "top givers" lists. See [[Recognition Anti-Patterns]] and [[Recognition]].
- A recipient's thanks is their own gift back. It is invited, never required, and never a condition of future help. See [[Gratitude Loop]].
- Sponsors fund purposes, not people. "Sponsor a child" or "adopt a family" mechanics are not offered.
- Gifts in kind that are unsuitable are **declined with thanks** ([[DP-03 Offer Acceptance]]), not accepted for the sake of a number.

## 2. Dignity

- Needs are taken at face value first and verified proportionately ([[DP-02 Need Verification]]). Nobody is asked to prove poverty or perform suffering.
- There is no "rejected" status. When we cannot help, we say so kindly, explain why, and refer onwards where we can ([[Lifecycle of a Need]]).
- People are addressed by the name they choose, in the language they choose ([[Multilingual Experience]]).
- Recipients control their own story. They see any text about them before it is shared beyond `private`.
- Language: people who need help, neighbours, recipients — never "victims", "the needy", "cases". See [[Brand and Tone of Voice]].

## 3. No proselytising, no political capture

- Aid is **never conditional** on belief, attendance, membership, a vote, a signature, a public statement or an interview.
- No religious, political or commercial material is packed into consignments or attached to deliveries.
- Givers and partners whose [[Intent Statement]] or conduct shows a hidden agenda — proselytising, campaigning, data harvesting, publicity-for-sale — are declined ([[Guiding Principles#P6. Clear water — clarity and purity of intent]]).
- Faith-based and civic organisations are welcome as partners on the same terms as anyone else: they help without conditions.
- Public content does not endorse parties, candidates or military units. Campaigns do not fund weapons or military equipment; the platform is for civilian humanitarian aid. #open-question (see below on dual-use items)

## 4. Neutrality and impartiality

- Help is allocated by need, form and feasibility only — never by nationality, ethnicity, religion, language, politics, or by who the recipient knows.
- Reputation shapes routing and verification depth, **never access** ([[ADR-005 Open Access for Recipients]]).
- Coordinators do not prioritise needs from their own family, village or social circle; such needs are handed to another coordinator (see §7).

## 5. No pity imagery

- No photographs of distress, tears, ruins as backdrop to people, or children in need. No "before and after" of people.
- Images show agency: people receiving, unloading, using, repairing, smiling if they choose to. Places are shown without identifying features in conflict zones.
- Faces are blurred by default above `private`; unblurred faces require explicit [[Consent Management|consent]] per photo.
- Copy never uses countdowns, guilt or "only you can…" ([[Brand and Tone of Voice]]).
- Editors reject any submitted image, including from partners, that breaks these rules ([[DP-10 Report Publication]]).

## 6. AI ethics

AI assistance via [[Vertex AI Integration]] is a tool for people, not a decision-maker.

| Rule | Meaning in practice |
|---|---|
| Humans decide | Matching suggestions are advisory ([[DP-04 Matching]]); no need is triaged, verified, refused or deprioritised by AI |
| Humans review | Every AI-drafted translation, summary, story or report is reviewed before it leaves `team` |
| Disclosed | Published text that began as an AI draft is labelled "Drafted with AI assistance and checked by our team" / «Підготовлено за допомогою ШІ та перевірено нашою командою» |
| Logged | Every AI action is a Log Event with `actor.via: vertex` |
| Minimal input | Redacted text only; health and safeguarding data are never sent |
| No profiling | AI is never used to score recipients' honesty, predict fraud from personal traits, or infer protected characteristics |
| No synthetic people | No AI-generated images of recipients or "representative" faces; no invented quotes |
| No training | Contracts ensure our data is not used to train models |

## 7. Conflicts of interest

- Staff, volunteers and carriers declare relationships with recipients, suppliers, carriers and partners. Declarations are held at `team` level.
- A coordinator may not be Lead Coordinator on a Flow for a relative or close friend, nor approve a [[Cost Record]] they incurred or that benefits them ([[DP-06 Cost Approval]] requires a second person).
- Suppliers connected to staff can be used only after the Finance Steward records a comparison of at least two quotes.
- Gifts to staff personally (money, goods, hospitality over GBP 25 or equivalent) are declined or declared.
- Sponsors do not choose individual recipients or see identifying data.

## 8. Do no harm

- **Security of locations.** Exact addresses, hub locations in Ukraine, convoy routes and timings are never public. Maps show oblast level with a delay ([[Flow Map]]). The Safeguarding Lead can freeze a region's public content instantly.
- **No live tracking** of vehicles or people on public or participant pages; journey steps appear after the leg is closed.
- **Occupied and frontline areas.** Content that could reveal who received help from a UK/Ukrainian organisation in or near occupied territory is kept `private` or `sealed` whatever the consent, because consent cannot protect someone from a third party.
- **Market effects.** Where local markets work, money or vouchers are preferred to shipped goods, so as not to undercut local traders.
- **Carrier safety.** No carrier is pressed to enter an area they consider unsafe. Declining a leg does not affect their [[Reputation]].
- **Data as a risk.** Every new data field passes the safety test in [[Data Minimisation]].
- **Dependency.** Programmes plan an exit and link recipients to local, sustainable services where they exist.

## 9. Honesty and transparency

- Numbers come from the log ([[Guiding Principles#P8. Honest numbers, beautifully shown]]); costs, including transport and overheads, are shown openly.
- Mistakes are corrected with a visible correction entry, not silently edited ([[Transparency Ledger]]).
- Restricted funds are spent on their stated purpose or returned / re-purposed only with the sponsor's written agreement.

## Signatories and acceptance

| Who | How they accept | Refreshed |
|---|---|---|
| Staff, coordinators, volunteers | In [[Admin Studio]] onboarding; logged as `role.CharterAccepted` | Annually |
| Carriers | Carrier conduct code in [[Safeguarding#Carrier conduct code]] at first leg | Annually |
| Partner organisations | Partnership agreement references the charter | On renewal |
| Sponsors | Sponsorship terms include §1, §3 and §7 | Per agreement |

> [!question] Dual-use items
> Some requests (generators, power banks, first-aid kits, tourniquets, vehicles) may be used by civilians or by defenders. Where exactly is the line for a civilian humanitarian charity under UK Charity Commission guidance? #open-question

## Related
[[Guiding Principles]] · [[Safeguarding]] · [[Privacy Model]] · [[Brand and Tone of Voice]] · [[Design Language]] · [[Accountability and Audit]]
