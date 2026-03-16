---
status: proposed
date: 2026-03-15
---

# ADR-0039: Extended Game Credits with Role Taxonomy

## Context and Problem Statement

The specification currently models three credit types as separate schemas: Designer, Artist, and Publisher. BGG tracks 10+ credit roles including developer, graphic designer, sculptor, editor, writer, insert designer, solo mode designer, and narrator. Real-world game credits are diverse — Brass: Birmingham credits designers (Gavan Brown, Matt Tolman, Martin Wallace), artists (6 people), and 22 publishers, plus has fields for solo designer, developer, graphic designer, sculptor, editor, writer, and insert designer. Without extended credit roles, the specification cannot represent complete game credits, blocking both publisher adoption (attribution is non-negotiable) and BGG migration ([ADR-0032](0032-strangler-fig-legacy-migration.md)).

## Decision Drivers

* Publishers and designers consider credit accuracy non-negotiable for data submission
* BGG tracks 10+ credit roles; our 3 schemas cover only ~30% of real credit data
* Adding a separate schema per role (Developer.yaml, GraphicDesigner.yaml, etc.) does not scale — every new role requires a spec change, new endpoints, new include values
* The existing Designer, Artist, and Publisher schemas are well-established and should not be broken
* A single person may hold multiple roles (e.g., Gavan Brown is both designer and artist on Brass: Birmingham)

## Considered Options

* **Separate schema per role** — Add Developer.yaml, GraphicDesigner.yaml, Sculptor.yaml, Editor.yaml, Writer.yaml, InsertDesigner.yaml, etc.
* **Unified Person schema replacing Designer/Artist** — Replace all people schemas with a single Person entity and role-based join table
* **Keep Designer/Artist, add Person + GameCredit for additional roles** — Preserve backward compatibility while extending credit coverage

## Decision Outcome

Chosen option: "Keep Designer/Artist, add Person + GameCredit," because it preserves backward compatibility with existing `/designers` and `/artists` endpoints while supporting all additional credit roles. Designer and Artist (the two most common roles, covering ~95% of credits) keep their dedicated schemas, endpoints, and include values. Publisher keeps its distinct schema (it has unique fields: `country`, `website`). All additional roles go through a `GameCredit` join table with a `role` enum.

The unified replacement was rejected because it would break existing endpoints and lose the ergonomic typed fields (Designer has `description`, Artist does not, Publisher has `country`/`website`). Separate schemas per role were rejected because they create 8+ new schemas, endpoints, and include values, and don't scale when new roles emerge.

### Consequences

* Good, because existing Designer, Artist, and Publisher endpoints remain unchanged — zero breaking changes
* Good, because all BGG credit roles can be represented
* Good, because a single person appearing in multiple roles (designer + artist) is naturally supported via the Person entity
* Good, because new roles can be added to the enum via the RFC process without schema restructuring
* Bad, because credits are split across two mechanisms (dedicated schemas for designer/artist, GameCredit for others) — the `/games/{id}/credits` endpoint must unify them
* Bad, because Person deduplication across BGG import requires fuzzy name matching

## Implementation

### New Schemas

**`spec/schemas/Person.yaml`** — Lightweight unified person entity. Designer and Artist become role-filtered views over Person.

Fields:
- `id` (UUID, required)
- `slug` (string, required)
- `name` (string, required)
- `description` (string, nullable)
- `game_count` (integer)
- `_links` (Links)

**`spec/schemas/GameCredit.yaml`** — Join model linking a person to a game with a specific role.

Fields:
- `game_id` (UUID, required)
- `person_id` (UUID, required)
- `role` (enum, required): `developer`, `graphic_designer`, `sculptor`, `editor`, `writer`, `insert_designer`, `solo_mode_designer`, `narrator`, `producer`
- `person_name` (string) — denormalized for convenience
- `person_slug` (string) — denormalized for link construction
- `_links` (Links)

### New Endpoint

**`GET /games/{id}/credits`** — Returns all credits for a game, unifying designers, artists, and additional GameCredit roles into a single response. Tagged under "People".

### Game Schema Changes

Add `credits` array to `Game.yaml` (GameCredit items), included via `?include=credits`.

### Include Parameter

Add `credits` to the include parameter in `spec/parameters/include.yaml`.

### BGG Migration Mapping

| BGG Credit Role | OpenTabletop Mapping |
|----------------|---------------------|
| boardgamedesigner | Designer schema (existing) |
| boardgameartist | Artist schema (existing) |
| boardgamepublisher | Publisher schema (existing) |
| Solo Designer | GameCredit with role `solo_mode_designer` |
| Developer | GameCredit with role `developer` |
| Graphic Designer | GameCredit with role `graphic_designer` |
| Sculptor / 3D Sculptor | GameCredit with role `sculptor` |
| Editor | GameCredit with role `editor` |
| Writer | GameCredit with role `writer` |
| Insert Designer | GameCredit with role `insert_designer` |
