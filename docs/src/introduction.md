# Introduction

**OpenTabletop** is an open specification for board game data. Think of it as the [MusicBrainz](https://musicbrainz.org/) of tabletop gaming: a community-governed, freely available data standard that any application can implement, contribute to, and build upon.

## The Problem

Board game data is in a crisis:

- **BoardGameGeek** is the de facto monopoly on board game metadata, but its API is an undocumented XML endpoint from the mid-2000s. It is rate-limited, fragile, and missing basic capabilities like filtering by player count and play time simultaneously. There is no official documentation, no versioning, and no contract — it can change without notice.
- **Board Game Atlas** attempted to be an alternative and then shut down entirely, taking its API and everyone's integrations with it.
- **No standard exists.** Every board game app, collection tracker, and recommendation engine scrapes BGG or maintains its own ad-hoc database. There is no shared vocabulary, no common schema, no interoperability.

This is the state of the art: a single proprietary website with an XML API that was never designed to be an API, and no fallback when it goes down or changes behavior.

OpenTabletop exists to fix this. Not by replacing BGG as a community — BGG is a great forum and review site — but by defining what board game data *looks like* as a structured, queryable, interoperable specification.

## The Three Pillars

The project is organized around three pillars, each solving a distinct part of the problem:

### Pillar 1: Standardized Data Model

A rigorous, relational data model for board games and everything associated with them. Games, expansions, designers, publishers, mechanics, categories, player counts, play times, complexity weights — all with well-defined types, relationships, and identifiers.

The data model handles the hard problems: an expansion that changes the player count of its base game. A standalone expansion that is both its own game and part of a family. A reimplementation that shares mechanics but is a distinct product.

### Pillar 2: Filtering & Windowing

The ability to ask real questions of the data. Not just "show me Catan" but "show me cooperative games for exactly 4 players that play in under 90 minutes at medium weight, excluding space-themed games." Six orthogonal filter dimensions that compose with boolean logic across hundreds of thousands of games.

This is the feature that does not exist anywhere today. BGG has no multi-dimensional filter. No board game service lets you query by effective player count with expansions included. OpenTabletop does.

### Pillar 3: Statistical Foundation

Raw data as a first-class output. Every opinion-based data point — player count polls, weight votes, community play times — is available as exportable, analyzable data. The specification does not lock you into one algorithm for "best player count" or one definition of "weight." It gives you the vote distributions and lets you decide.

## A Taste of What This Enables

Imagine it is game night. You have 4 people, about 90 minutes, and your group prefers medium-weight cooperative games. You own Spirit Island with the Branch & Claw expansion. One person does not like space themes.

With OpenTabletop, this is a single API call:

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 4,
  "playtime_max": 90,
  "weight_min": 2.0,
  "weight_max": 3.5,
  "mechanics": ["cooperative"],
  "theme_not": ["space"],
  "effective": true,
  "sort": "rating_desc",
  "limit": 20
}
```

The `effective: true` flag means the search considers expansion combinations. Spirit Island base game supports 1-4 players at 90-120 minutes — too long. But the API knows that with Branch & Claw, community-reported play times for experienced players at 4p average 85 minutes. It might appear in your results. Or it might not, depending on the data. The point is that the API *can reason about this* because the data model supports it.

No other board game API can answer this query today.

## Project Status

OpenTabletop is in the **specification phase**. The project is defining:

1. The OpenAPI 3.2 specification document — the canonical source of truth
2. This documentation, which explains the design rationale and data model
3. Architecture Decision Records (ADRs) that capture key choices
4. A governance model for community-driven evolution

A reference implementation (Rust/Axum server with PostgreSQL) and SDKs (Rust, Python, JavaScript) will follow once the specification stabilizes.

The specification is developed in the open under dual licensing: Apache 2.0 for code, CC-BY-4.0 for the specification and documentation. Contributions are welcome — see the [Governance Model](./governance.md) and [Getting Started](./guides/getting-started.md) guide.
