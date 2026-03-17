---
status: accepted
date: 2026-03-12
---

# ADR-0013: Compound Multi-Dimensional Filtering as Core Feature

## Context and Problem Statement

The central value proposition of the OpenTabletop API is enabling consumers to answer questions like "What are the best worker-placement games for exactly 3 players that play in under 90 minutes with medium-heavy weight?" This requires composable multi-dimensional filtering across six dimensions simultaneously. The filtering system is not just a feature -- it is THE core feature that differentiates this API from existing board game data sources.

## Decision Drivers

* Filtering must compose across all six dimensions: player count, playtime, weight, mechanics/type, themes, and metadata
* Expansion-aware filtering (effective=true) must resolve combined properties per ADR-0007
* Simple use cases (single filter) must remain simple; complex queries should be possible but not required
* The query interface must be expressible both as GET query parameters and as structured POST bodies

## Considered Options

* Simple parameter-based filters (player_count=3&max_playtime=90)
* Custom query language (DSL parsed from a query string)
* Compound composable filters with GET for simple queries and POST /games/search for complex queries

## Decision Outcome

Chosen option: "Compound composable filters with dual GET/POST interface", because it keeps simple queries simple while enabling arbitrarily complex multi-dimensional filtering. Simple filters use GET query parameters on `/games` (e.g., `?min_players=3&max_playtime=90&mechanic=worker-placement`). Complex queries that combine multiple values per dimension, boolean logic, or expansion-aware resolution use POST `/games/search` with a structured JSON body. The `effective=true` parameter triggers expansion-aware property resolution per ADR-0007's three-tier model. A custom DSL was rejected because it requires clients to learn a proprietary query syntax. Simple parameters alone were rejected because they cannot express compound conditions within a single dimension (e.g., "mechanic is worker-placement AND area-control").

### Consequences

* Good, because simple filtering via GET parameters requires zero learning curve
* Good, because POST /games/search enables arbitrarily complex queries with a structured, validatable JSON body
* Good, because expansion-aware filtering via effective=true is a unique differentiator for this API
* Bad, because two query interfaces (GET and POST) mean two code paths to maintain and document
* Bad, because expansion-aware filtering requires additional query complexity and may be slower than base-only filtering
