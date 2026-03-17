# Introduction

**OpenTabletop** is an open specification for board game data -- a schema, vocabulary, and API contract that defines what a board game database should look like. Think of it as the [MusicBrainz](https://musicbrainz.org/) of tabletop gaming: a community-governed standard that anyone can implement with their own data. OpenTabletop is not a database. It is the blueprint for building one.

## The Problem

Board game data is in a crisis:

- **BoardGameGeek** is the de facto monopoly on board game metadata, but its API is an undocumented XML endpoint from the mid-2000s. It is rate-limited, fragile, and missing basic capabilities like filtering by player count and play time simultaneously. There is no official documentation, no versioning, and no contract -- it can change without notice. Worse, BGG does not facilitate others building on its data -- no bulk exports, no interoperability, no ecosystem. The data goes in and it does not come out.
- **Board Game Atlas** attempted to be an alternative and then shut down entirely, taking its API and everyone's integrations with it.
- **No standard exists.** Every board game app, collection tracker, and recommendation engine scrapes BGG or maintains its own ad-hoc database. There is no shared vocabulary, no common schema, no interoperability.

This is the state of the art: a single proprietary website with an XML API that was never designed to be an API, and no fallback when it goes down or changes behavior. A little competition could do the space some good -- but competition requires a shared foundation to build on.

OpenTabletop exists to provide that foundation. Not by replacing BGG as a community -- BGG is a great forum and review site -- but by defining the specification so that *multiple* platforms, apps, and databases can exist, interoperate, and compete. Any developer can stand up a conforming server with their own data. Any app can consume any conforming API. The specification is the commons; the implementations are the marketplace.

Critically, the specification is **language-agnostic and designed for global adoption**. It does not assume English, does not assume BGG's voter population, and does not assume a Western-centric hobby. A Japanese board game community can run a conforming server with Japanese game names, Japanese community data, and Japanese voter preferences. A German community can do the same. A Brazilian community can do the same. All of these servers speak the same API contract -- an app built against any one of them works against all of them. Games carry [alternate names](./pillars/data-model/games.md) in any language, voting data is disaggregated by community, and the taxonomy uses canonical slugs that implementations surface in their own language. The standard enables a global ecosystem where regional communities maintain their own data while remaining interoperable.

## The Three Pillars

The project is organized around three pillars, each solving a distinct part of the problem:

### Pillar 1: Standardized Data Model

A rigorous, relational data model for board games and everything associated with them. Games, expansions, designers, publishers, mechanics, categories, player counts, play times, complexity weights -- all with well-defined types, relationships, and identifiers.

The data model handles the hard problems: an expansion that changes the player count of its base game. A standalone expansion that is both its own game and part of a family. A reimplementation that shares mechanics but is a distinct product.

### Pillar 2: Filtering & Windowing

The ability to ask real questions of the data. Not just "show me *Catan*" but "show me cooperative games for exactly 4 players that play in under 90 minutes at medium weight, excluding space-themed games." Six orthogonal filter dimensions that compose with boolean logic across hundreds of thousands of games.

This is the feature that does not exist anywhere today. BGG has no multi-dimensional filter. No board game service lets you query by effective player count with expansions included. The OpenTabletop specification makes this possible.

### Pillar 3: Statistical Foundation

Board game data is rich -- millions of ratings, weight votes, player count polls accumulated over two decades -- but today it is locked inside formats that make real analysis impossible. BGG's "top games" rankings, weight scores, and player count recommendations are black boxes: you get a single number, not the underlying data. No data scientist, analyst, or statistician can do meaningful work with an undocumented XML endpoint that returns a pre-computed average.

OpenTabletop specifies data structures built for analysis. Player count polls are stored as per-count vote distributions, not a min/max range. Weight is a full vote distribution, not a single number. Community play times are statistical distributions with percentiles, not a box estimate. A conforming data source gives researchers actual material to work with: alternative ranking algorithms, trend analysis over time, complexity studies, recommendation engines -- all become possible when the data is structured for analysis from the ground up.

## A Taste of What This Enables

Imagine it is game night. You have 4 people, about 90 minutes, and your group prefers medium-weight strategy games. You own *Ticket to Ride: Europe* with the *Europa 1912* expansion. One person does not like horror themes.

With a conforming OpenTabletop server, this is a single API call:

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 4,
  "playtime_max": 90,
  "weight_min": 2.0,
  "weight_max": 3.5,
  "mechanics": ["route-building"],
  "theme_not": ["horror"],
  "effective": true,
  "sort": "rating_desc",
  "limit": 20
}
```

The `effective: true` flag means the search considers expansion combinations. Ticket to Ride: Europe's box says 30-60 minutes, but community-reported play times for 4 players with Europa 1912's expanded ticket set average closer to 70 minutes -- still under the 90-minute cap. A conforming server knows this because the data model tracks how expansions modify effective play time. It uses community-reported times, not the publisher's box estimate, so the results reflect how the game plays for the community of players who log their sessions -- often a closer match to your experience than publisher estimates, especially for experienced groups.

No other board game API can answer this query today.

## Project Status

OpenTabletop is in the **specification phase**. The project is defining:

1. The OpenAPI 3.2 specification document -- the canonical source of truth
2. This documentation, which explains the design rationale and data model
3. Architecture Decision Records (ADRs) that capture key choices
4. A governance model for community-driven evolution

The project provides schemas, controlled vocabularies, sample data, and implementer guidance -- everything a developer needs to build a conforming server or client in the language of their choice.

The specification is developed in the open under dual licensing: Apache 2.0 for code, CC-BY-4.0 for the specification and documentation. Contributions are welcome -- see the [Governance Model](./governance.md) and [Getting Started](./guides/getting-started.md) guide.
