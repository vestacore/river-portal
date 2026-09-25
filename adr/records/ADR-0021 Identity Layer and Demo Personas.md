---
type: adr
status: accepted
date: 2026-09-25
tags: [adr, identity, access, demo]
spec: spec/08-architecture/Identity and Access.md
---

# ADR-0021 Identity Layer and Demo Personas

## Context
The domain review (`meta/reviews/2026-09-25 Site Map and Domain Review.md`, vector V1) found that the portal could be seen only as an anonymous visitor or as one IAP staff member with a single role. Nobody could walk the whole scenario: a request, a gift, a delivery, costs, the confirmation, the thanks and the report.

The owner asked for sections behind authorisation for every role, with a **non-IAP method for debugging**. Public participants will later sign in with Firebase; staff sign in through Identity-Aware Proxy (ADR-0009, ADR-0010).

## Decision
- **`@river/identity`** (foundation, layer 0) holds:
  - the twelve roles of the specification;
  - `Identity { personId, name, roles[], via: 'iap' | 'demo' | 'firebase' }`;
  - `hasRole` and `isStaff`;
  - a **signed session**: base64url JSON plus HMAC-SHA256, compared in constant time, valid for 12 hours.
- **Authentication modes** (`RuntimeConfig.auth`), each tied to a surface:
  - `iap`: the studio surface in the cloud;
  - `demo`: local runs, or a cloud sandbox only with `RIVER_AUTH=demo`, `RIVER_DEMO_SANDBOX=1` and a session secret;
  - `none`: the public surface, where `/me`, `/studio` and `/demo` do not exist.
- **Only `proxy.ts` verifies.** It checks the IAP JWT or the demo cookie, then passes the result in a request header. Roles are resolved on the server: an IAP e-mail maps to roles through `RIVER_STAFF_ROLES` (`a@x:administrator|editor`); a demo persona maps to its fixed roles.
- **Nine demo personas** on four "banks":
  - left bank: Olena (recipient);
  - right bank: James (giver) and Harbour Print (sponsor and giver);
  - channel: Mykola (carrier) and Andriy (coordinator);
  - stewards: Helen (Finance Steward), Sofia (editor), Iryna (administrator) and Priya (auditor).

  Their names change with the profile's demo variant.
- **`/demo`** lets a visitor choose a persona and, with the in-memory store, a profile; switching profile starts the demo again. **`/demo/walk`** is a guided walk of ten steps, each signing in as the person whose turn it is. The demo seed is built so that every step has something to do.
- **`/me` ("My river")** shows each person their own part of the river:
  - recipients follow and confirm their requests;
  - givers and sponsors see where each gift went, the report, and thanks shared with them (names removed);
  - carriers hand deliveries over and record costs;
  - staff are pointed to the studio.
- **The studio follows the river.** Seven stages (overview, inflow, channels, tolls, mouth, surface, settings) each state which roles may **see** them and which may **act**. Auditors see every stage and act in none. Pages hide what a person cannot do, and every Server Action checks the roles again.
- **Capacity.** An action runs in the first of the required roles the person holds, and that role is recorded as the actor's role. The audit trail therefore shows, for example, that Helen approved a cost *as Finance Steward*. Domain rules check capacity too: `approveCost` refuses a coordinator above the Lead Coordinator's limit (DP-06).

## Consequences
- **Positive**
  - The whole scenario can be tested end to end by role, locally or in a sandbox.
  - The public surface carries no sign-in code paths.
  - The audit trail records who acted and in which capacity.
- **Negative**
  - Demo mode lets anyone act as an administrator. This is by design, with fictional data and a memory store; guards stop it in production (the public surface has no demo, and demo with Firestore needs an explicit sandbox flag).
  - Real public sign-in (Firebase) is not built yet (TD-15).
  - Staff roles still come from an allow-list (TD-05).
  - Registered carriers come from the demo personas until a people registry exists (TD-20).

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Firebase Authentication with the emulator for demos | The right tool for real public users later; too heavy for walking roles in a demo |
| Auth.js (NextAuth) | A new dependency and session model alongside IAP; we need very little of it |
| One IAP test account per role | Cannot represent public roles (recipient, giver, carrier); slow to switch; needs cloud access |
| A client-side role switcher without signatures | Trivially forged; would train the code to trust the browser |

Back to [[00 ADR Home]].
