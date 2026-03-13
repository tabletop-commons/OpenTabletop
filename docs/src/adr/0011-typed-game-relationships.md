---
status: accepted
date: 2026-03-12
---

# ADR-0011: Typed Game Relationships with JSONB Metadata

## Context and Problem Statement

Board games have rich relationships with each other: a game can be expanded by expansions, reimplemented as a new edition, contained within a compilation, required as a dependency, recommended as a companion, or designed to integrate mechanically with another game. These relationships are typed and directional, and some carry additional metadata (e.g., which edition a reimplementation replaces). We need a relationship model that captures this variety without over-engineering.

## Decision Drivers

* Relationship types are diverse and directional (A expands B is different from B expands A)
* Some relationship types carry metadata (e.g., integration instructions, edition history)
* Queries like "all expansions for game X" and "all games that reimplement game Y" must be efficient
* The model should be extensible to new relationship types without schema changes

## Considered Options

* Simple parent_id foreign key on the games table
* Dedicated GameRelationship table with typed edges and JSONB metadata
* Full graph database (Neo4j or similar)

## Decision Outcome

Chosen option: "GameRelationship table with typed edges and JSONB metadata", because it captures the full variety of game relationships in a relational model without requiring graph database infrastructure. The table has columns: `source_game_id`, `target_game_id`, `relationship_type` (enum: `expands`, `reimplements`, `contains`, `requires`, `recommends`, `integrates_with`), and a `metadata` JSONB column for type-specific attributes. Indexes on `(source_game_id, relationship_type)` and `(target_game_id, relationship_type)` enable efficient lookups in both directions. The parent_id approach was rejected because it can only model one relationship type. A graph database was rejected because it adds significant operational complexity for a relationship model that is well-served by indexed relational queries.

### Consequences

* Good, because all relationship types are modeled uniformly with a single table and query pattern
* Good, because JSONB metadata allows type-specific attributes without schema proliferation
* Good, because new relationship types can be added to the enum without structural changes
* Bad, because JSONB metadata is less strictly typed than dedicated columns, requiring application-level validation
* Bad, because bidirectional queries require checking both source and target columns (mitigated by dual indexes)
