---
type: moc
status: stable
tags: [moc, adr]
aliases: [ADR Home]
---

# Architecture Decision Records — River Portal

The engineering log of **architecture decisions** taken while building the portal. It complements the product specification vault in `spec/`: the ADRs in `spec/08-architecture/adr/` state *what the product needs*, and the records here state *how we build it*, including where we knowingly depart from the spec.

- Language: British English.
- One decision per note: `records/ADR-NNNN Title.md`. Numbers are never reused.
- Status: `proposed` → `accepted` → (`superseded` by ADR-NNNN | `deprecated`).
- A decision taken as the **nearest sensible variant** while a product question is still open is marked `accepted-provisional` and links to the question in `spec/00-meta/Open Questions.md`.
- Template: [[Template — ADR Record]]. Process observations live in the separate `meta/` vault.

> Licence: CC BY-NC 4.0; commercial use by agreement. See `LICENSE-DOCS.md` in the repository root.

## Index

| # | Decision | Status | Area |
|---|---|---|---|
| [[ADR-0001 Monorepo with npm Workspaces]] | npm workspaces, no extra package manager | accepted | repository |
| [[ADR-0002 Package Topology and Gates]] | Packages expose one `gate.ts`; cross-package access only via gates | accepted | code structure |
| [[ADR-0003 One Public Function per File]] | One exported function per file; data structures in their own files | accepted | code structure |
| [[ADR-0004 Next.js App Router for UI]] | Next.js 16.1 App Router, React 19.1, server-rendered pages | accepted | UI |
| [[ADR-0005 Tailwind CSS with Design Tokens]] | Tailwind CSS 4.1, tokens in `@theme`, own component kit (visual parts superseded by ADR-0018) | accepted (amended) | UI |
| [[ADR-0006 In-Place Editing with Tiptap]] | Headless Tiptap for editing content blocks and reports (in-place editing superseded by ADR-0022) | accepted (amended) | UI / content |
| [[ADR-0007 Dependency Supply-Chain Policy]] | Two minor lines behind latest, exact pins, installs via Socket `sfw`, no install scripts | accepted | security |
| [[ADR-0008 Pulumi TypeScript for Infrastructure]] | All Google Cloud resources in Pulumi; no manual console changes | accepted | infrastructure |
| [[ADR-0009 Edge with Load Balancer and Cloud Armor]] | Global external Application Load Balancer, Cloud Armor Standard + preconfigured WAF | accepted | security / edge |
| [[ADR-0010 One App, Two Surfaces]] | Same Next.js image deployed as public `web` and IAP-protected `studio` services (edit mode removed by ADR-0022) | accepted (amended) | deployment |
| [[ADR-0011 Store Drivers and Synchronous Projections]] | Memory and Firestore drivers behind one interface; projections written in the same transaction as events | accepted-provisional | data |
| [[ADR-0012 Page Documents for Fast Reads]] | Public pages render from one or two pre-shaped Firestore documents | accepted | data / performance |
| [[ADR-0013 AI Feed Composition via Vertex AI]] | Gemini on Vertex AI proposes feed snippets from private reports; humans approve | accepted | AI |
| [[ADR-0014 Container Builds via Cloud Build from Pulumi]] | Pulumi runs Cloud Build (no local Docker) and deploys the resulting image digest | accepted | delivery |
| [[ADR-0015 TypeScript Without a Build Step for Packages]] | TypeScript 5.9, explicit `.ts` imports, erasable syntax only, `node:test` via type stripping | accepted | tooling |
| [[ADR-0016 Default Domain via sslip.io]] | Until a real domain exists, hostnames derive from the load balancer IP | accepted-provisional | edge |
| [[ADR-0017 Own Lightweight Internationalisation]] | Dictionaries per locale in a package; locale-prefixed routes; no i18n library yet | accepted-provisional | UI |
| [[ADR-0018 Drafting-Table Visual Language]] | Flat "open plan" language: paper and graphite, bevelled plates, overshooting hairlines, dimension lines, IBM Plex | accepted | UI / design |
| [[ADR-0019 Licensing and Open Publication]] | Apache 2.0 for code; CC BY-NC 4.0 plus commercial-by-agreement for spec, adr and meta; CC BY 4.0 for the Oleshky fact sheet | accepted | project |
| [[ADR-0020 Settings Registry and Organisation Profiles]] | One registry of typed settings with floors; three profiles (state programme, city foundation, small nationwide); changes recorded as events | accepted | configuration |
| [[ADR-0021 Identity Layer and Demo Personas]] | Roles and signed sessions; IAP for staff, demo personas locally; "My river"; the studio by river stages with see/act roles | accepted | identity / access |
| [[ADR-0022 Editing in the Studio, Not on Public Pages]] | Site texts and page structure edited only in the studio; public pages carry no editing code | accepted | UI / content |
| [[ADR-0023 Reporting Currency and Recorded Conversion Rates]] | A reporting currency in settings; each cost keeps its currency and the rate used | accepted | money |
