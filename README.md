# OpenTabletop

[![Build & Deploy Docs](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/build-docs.yml/badge.svg)](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/build-docs.yml)
[![Validate OpenAPI Spec](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/validate-openapi.yml/badge.svg)](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/validate-openapi.yml)
[![ADR Check](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/adr-check.yml/badge.svg)](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/adr-check.yml)
[![Build & Push Container](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/container.yml/badge.svg)](https://github.com/tabletop-commons/OpenTabletop/actions/workflows/container.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://tabletop-commons.github.io/OpenTabletop/)
[![License: Apache 2.0](https://img.shields.io/badge/code-Apache%202.0-blue)](LICENSE)
[![License: CC-BY-4.0](https://img.shields.io/badge/spec-CC--BY--4.0-lightgrey)](https://creativecommons.org/licenses/by/4.0/)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-green)](spec/openapi.yaml)

**The open standard for board game data.**

Board games deserve what MusicBrainz built for music and TMDb built for film: a community-driven, standardized API that any application can build on. OpenTabletop is that standard.

## The Problem

BoardGameGeek's XML API is the de facto source for board game data, but it's showing its age: undocumented rate limits, recent authentication breakage, XML-era design, and critical missing features. Board Game Atlas -- the only real competitor -- shut down entirely. Every developer building a board game app reinvents the same wrappers, the same workarounds, the same incomplete data models.

There is no standard way to answer the question every board gamer asks:

> "We have 4 people, about 90 minutes, and we want something medium-weight and cooperative -- what should we play?"

This problem isn't limited to English-speaking markets. Board game communities exist worldwide -- in Japan, Germany, Brazil, South Korea, France, China, and beyond -- each with their own data silos, their own platforms, and no interoperability between them. OpenTabletop is language-agnostic by design: games carry alternate names in any language, community data is disaggregated by population, and any regional community can run a conforming server with their own language and their own data. The standard enables a global ecosystem.

## The Three Pillars

### Pillar 1: Standardized Data Model

Define the vocabulary once. Games, expansions, promos, reimplementations, mechanics, categories, themes, designers, publishers -- with proper relationships, proper types, and proper schemas. Every decision recorded as an Architecture Decision Record (ADR).

### Pillar 2: Filtering & Windowing

**The showcase feature.** Compound, multi-dimensional filtering that winnows thousands of games to exactly what you want in a single query:

```
GET /games?players=4&community_playtime_max=90&weight_min=2.0&weight_max=3.5
    &mode=cooperative&mechanics=hand-management&theme_not=space
    &effective=true&sort=bayes_rating&order=desc
```

Six composable dimensions: player count (including expansion-modified "best at"), play time (publisher-stated vs community-reported), weight/complexity, game mode & mechanics (AND/OR/NOT), themes, and metadata. Set `effective=true` to filter against expansion-modified properties -- something no existing API can do.

### Pillar 3: Statistical Foundation

Every opinion-based data point -- player count polls, weight votes, community play times, expansion deltas -- is stored as raw, exportable, analyzable data. Bulk export in JSON Lines and CSV. The API doesn't just serve aggregates; it serves the distributions that power them.

## Expansion Combination Model

Expansions don't just add content -- they change how a game plays. OpenTabletop tracks this:

```
Spirit Island (base):                1-4 players, best@2,     weight 3.9
  + Branch & Claw:                   1-4 players, best@2,     weight 4.0
  + Jagged Earth:                    1-6 players, best@2-3,   weight 4.1
  + Branch & Claw + Jagged Earth:    1-6 players, best@2-4,   weight 4.2
```

The combination of Branch & Claw + Jagged Earth has emergent effects that differ from summing their individual deltas. The API stores explicit community-curated data for expansion combinations and falls back to computed deltas when explicit data doesn't exist.

## Project Structure

```
spec/           OpenAPI 3.1 specification (source of truth)
docs/           mdbook documentation with mermaid diagrams
reference/      Reference server implementation (Rust/Axum)
sdks/           Client SDKs (Rust, Python, JavaScript/TypeScript)
```

## Quick Start

**Browse the documentation:**

```sh
# Build and serve docs locally
mdbook serve docs/
```

**Validate the spec:**

```sh
npx @stoplight/spectral-cli lint spec/openapi.yaml
```

**Bundle the spec into a single file:**

```sh
./scripts/bundle-spec.sh
```

## Architecture

- **Spec-first**: The OpenAPI specification is written before any implementation
- **ADR-driven**: Every architectural decision is recorded in `docs/src/adr/`
- **Cloud-native**: 12-factor, container-first, Kubernetes-ready
- **Multi-language**: Reference server in Rust; SDKs in Rust, Python, JavaScript/TypeScript

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to:

- Propose spec changes via the RFC process
- Submit data corrections
- Contribute to reference implementations and SDKs

## Governance

OpenTabletop uses an RFC-based governance model. Spec changes require a formal RFC, community discussion, and steering committee approval. See [docs/src/governance.md](docs/src/governance.md).

## License

- **Code** (reference implementation, SDKs, tooling): [Apache License 2.0](LICENSE)
- **Specification** (OpenAPI spec, documentation): [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)
