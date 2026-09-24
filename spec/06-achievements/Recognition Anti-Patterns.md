---
type: achievement
status: draft
tags: [achievements, ethics, anti-patterns]
aliases: [What We Do Not Do, Dark Patterns We Refuse]
related: ["[[Guiding Principles]]", "[[Ethics Charter]]", "[[Recognition]]"]
---

# Recognition Anti-Patterns

What River Portal **deliberately does not do**, even though many fundraising and engagement platforms do. Each item names the reason and the principle it protects. Proposals for new features are checked against this list. Back to [[Achievements Overview]].

> [!principle] Scale without changing character
> These refusals hold for a Tier 1 van fundraiser and a Tier 4 programme alike. No configuration switch turns them on. See [[Guiding Principles#P11. Scale without changing character]].

## The list

| # | Anti-pattern | Why we refuse it | Principle | What we do instead |
|---|---|---|---|---|
| AP-01 | **Donor leaderboards by amount** | Turns a gift into status bought with money; shames small givers; distorts giving towards display | [[Guiding Principles#P1. A gift is a gift]] | Alphabetical, opt-in supporters list without amounts ([[Recognition]]) |
| AP-02 | **Badges or tiers for money** ("Gold donor", "£1 000 club") | Recognition would be purchasable | P1 | Participation acknowledgements equal for everyone |
| AP-03 | **Public scoring or ranking of recipients** | Ranks people by worthiness; stigmatises; can be used against them | [[Guiding Principles#P2. A need is respected]], [[Guiding Principles#P3. The left bank is always open]] | Internal signals for verification depth only ([[Reputation Signals]]) |
| AP-04 | **"Vote for the most deserving need"** | Popularity contests for help; rewards the most photogenic suffering | P2 | Coordinator matching by need shape at [[DP-04 Matching]] |
| AP-05 | **Pity-based virality** (sad-face thumbnails, "share if you care") | Instrumentalises suffering; violates dignity; recipients lose control of their image | [[Guiding Principles#P10. Dignity in every pixel]], [[Guiding Principles#P5. Consent is specific and revocable]] | Agency-focused, consented [[Journey Story]]s |
| AP-06 | **Streaks and loss-aversion pressure** ("Don't break your 6-month streak!") | Manipulates through guilt; givers should give when they can | [[Brand and Tone of Voice]] (Never guilt) | Anniversaries as gentle remembrance, opt-out ([[Recognition]]) |
| AP-07 | **Countdown urgency** ("3 hours left to save…") | Manufactured pressure; misrepresents how aid works | Never guilt; [[Guiding Principles#P8. Honest numbers, beautifully shown]] | Honest progress and budget on [[Campaign Page]] |
| AP-08 | **Publicity for sale** (bigger gift → logo placement, named story) | Visibility bought with money; conflicts of interest | P1, [[Guiding Principles|P6 Clear water]] | Purpose-based sponsor acknowledgement, same for all sizes |
| AP-09 | **Carrier or volunteer leaderboards** | Competition encourages unsafe driving and burnout; frontline risk | P1, [[Safeguarding]] | Private kilometre totals, opt-in public mention without comparison |
| AP-10 | **Single public trust score** for anyone | Opaque, unexplainable, uncontestable | [[Guiding Principles#P7. The river remembers]] (explainable history) | Explainable signals, self-view, [[DP-11 Reputation Review]] |
| AP-11 | **Requiring thanks or photos from recipients** as a condition of help | Makes help conditional; performance of gratitude | P2, [[Guiding Principles#P9. Thanks travels upstream]] | Optional [[Gratitude Note]]; proxy / carrier confirmation paths |
| AP-12 | **Hiding costs to inflate impact** ("100% goes to the cause") | Dishonest; undermines trust when discovered | P8 | Cost share shown in every [[Donor Report]] and the [[Transparency Ledger]] |
| AP-13 | **Engagement scoring of givers** (opens, clicks → "warm lead") | Treats givers as conversion targets; privacy intrusion | [[Guiding Principles#P4. Private by default]] | No tracking pixels; aggregate-only newsletter metrics ([[Newsletter Digest]]) |
| AP-14 | **Social comparison** ("Your neighbours gave £50 on average") | Pressure and implied judgement | P1, Never guilt | Collective milestones ([[Milestones]]) |
| AP-15 | **Before/after transformation imagery of people** | Reduces people to a problem solved by the giver | P10 | Images of the chain at work, consented, faces optional |
| AP-16 | **AI-generated emotional content** (synthetic faces, invented quotes) | Fabrication; destroys trust | P8, [[Vertex AI Integration]] rules | AI drafts only from real records, human-reviewed, never auto-published ([[Publication Pipeline]]) |

## How the list is enforced

- **Design review**: every feature proposal in 04-form and 06-achievements references this note; a match with any AP requires an [[Ethics Charter]] review.
- **Data model**: there is no field to rank givers by amount in any `public` projection; giver amounts are `private` at field level. See [[Visibility Policy]].
- **Content review**: the [[DP-10 Report Publication]] checklist includes "no AP-05, AP-07, AP-15, AP-16".
- **Configuration**: [[Admin Studio]] exposes no switch that enables AP items, even for large clients.

## Related

[[Ethics Charter]] · [[Guiding Principles]] · [[Recognition]] · [[Reputation Signals]] · [[Brand and Tone of Voice]] · [[Design Language]]
