---
status: accepted
date: 2026-03-12
---

# ADR-0006: Unified Game Entity with Type Discriminator

## Context and Problem Statement

Board games come in many forms: base games, expansions, standalone expansions, promos, accessories, and fan expansions. These types share the vast majority of their attributes (name, description, player count, playtime, weight) but differ in their relationships and a few type-specific fields. We need a data model that handles all game types without unnecessary complexity or query overhead.

## Decision Drivers

* Queries across all game types (e.g., "all games by designer X") must be simple and fast
* The model must accommodate type-specific attributes without excessive nullability
* Expansion-aware filtering requires knowing a game's type at query time
* The schema should be easy to understand for API consumers

## Considered Options

* Separate tables per game type (games, expansions, promos, etc.)
* Single unified table with a type discriminator column
* Polymorphic inheritance with a base table and type-specific extension tables

## Decision Outcome

Chosen option: "Single unified table with type discriminator", because it produces the simplest queries and avoids JOINs for the most common operations. The `game_type` column uses an enum with values: `base_game`, `expansion`, `standalone_expansion`, `promo`, `accessory`, and `fan_expansion`. Type-specific attributes that only apply to certain types (e.g., `requires_base_game` for expansions) are nullable columns. Separate tables were rejected because cross-type queries become expensive UNIONs. Polymorphic inheritance was rejected because the shared attribute set is so large that extension tables would have very few columns, making the complexity unjustified.

### Consequences

* Good, because all game types are queryable from a single table with simple WHERE clauses
* Good, because the discriminator column enables efficient type-filtered indexes
* Good, because the API surface is uniform — one /games endpoint serves all types
* Bad, because some columns are nullable for types where they don't apply (e.g., base games don't have `requires_base_game`)
* Bad, because adding a new game type requires careful review of which columns apply
