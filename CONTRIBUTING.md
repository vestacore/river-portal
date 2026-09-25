# Contributing to River Portal

Thank you for helping. River Portal is a research project in **AI-driven development**: people and an AI assistant work from the same specification and records. Contributions are welcome from people, and from people working with AI. People remain accountable for what they submit.

## Before you start
- Read [`TOPOLOGY.md`](TOPOLOGY.md) for how the code is organised, and open `spec/`, `adr/` and `meta/` in [Obsidian](https://obsidian.md) (each is a vault).
- The single sources of truth are `spec/00-meta/Vault Map.md` for note names and `spec/00-meta/Canonical Parameters.md` for thresholds and event names.
- Write documentation, ADRs and meta notes in **British English**. Demo content is bilingual (en-GB and Ukrainian).

## Working rules
1. **Code shape.** TypeScript functions, **one exported function per file** (named like the file), data structures in `types/`, and every package exposes only `gate.ts`. Import other packages only through their gate. `npm run topology` enforces this.
2. **Checks.** Run `npm run check` (types, topology, tests) before opening a pull request.
3. **Dependencies.** Pick versions with `node tools/pick-version.mjs` (two minor lines behind latest), install **only** with `sfw npm install`, keep exact pins, run `npm audit`, and record every new direct dependency in `meta/process/Dependency Register.md` (policy: ADR-0007).
4. **Decisions.** Record architecture decisions as a new `adr/records/ADR-NNNN …` note. Record process observations in `meta/`.
5. **Privacy.** Never commit real personal data. Demo people and places must be fictional or public. Keep personal data out of log events.
6. **Infrastructure.** Change Google Cloud only through `infra/` (Pulumi). No console changes.

## Licensing of contributions
- **Code and everything outside `spec/`, `adr/` and `meta/`**: your contribution is licensed under the [Apache License 2.0](LICENSE) (inbound = outbound, Section 5 of the licence).
- **`spec/`, `adr/`, `meta/`**: you license your contribution under [CC BY-NC 4.0](LICENSE-DOCS.md). You also grant the maintainers a perpetual, worldwide, non-exclusive, royalty-free right to include it in separate commercial licences of these materials. You confirm that you have the right to make the contribution.

By opening a pull request you agree to these terms.
