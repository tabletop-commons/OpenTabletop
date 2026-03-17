---
status: accepted
date: 2026-03-13
---

# ADR-0035: Edition-Level Property Deltas

## Context and Problem Statement

Board game databases like BGG lump all printings of a game under a single record. Consider Samurai (BGG /boardgame/3/samurai): the original 1998 Hans im Gluck/Rio Grande printing and the 2015 Fantasy Flight Games reprint share one entry, yet they differ in component quality, graphic design, rules clarity, and potentially gameplay feel. The 2015 edition includes revised rules with clearer examples and upgraded components, resulting in a slightly different perceived weight.

The current `GameEdition` schema (see `spec/schemas/GameEdition.yaml`) captures only flat publishing metadata: publisher, year, language, and freeform notes. It cannot express structured property differences between printings. This means edition-specific weight, playtime, or player-count differences are invisible to the filtering system. A user searching for "games under weight 3.0" might miss a lighter reprint or include a heavier one, because the system only knows the canonical edition's values.

The project already has a well-established delta pattern via `PropertyModification` (ADR-0007) for expansion effects. Editions need a similar but simpler model: one edition is active at a time, so there is no combinatorial explosion.

## Decision Drivers

* Editions can differ in weight, playtime, and occasionally player count (e.g., a reprint adds a solo variant)
* Must compose with the existing expansion effective-properties pipeline (ADR-0007) and experience adjustment (ADR-0034)
* Only one edition is active at a time -- no combinatorial explosion like expansions
* Should reuse the existing delta vocabulary (additive deltas, same field names) for consistency
* Must be backward compatible -- games without edition data behave exactly as today
* Need both structured (filterable) deltas and human-readable change descriptions

## Considered Options

* **Freeform notes on GameEdition (status quo)** -- Keep the existing `notes` field for edition differences
* **Reuse PropertyModification with polymorphic source** -- Add an `edition_id` field to `PropertyModification` and use the same schema for both expansion and edition deltas
* **New EditionDelta schema** -- A dedicated schema for edition-level property changes

## Decision Outcome

Chosen option: "New EditionDelta schema," because editions and expansions have fundamentally different resolution semantics. Expansions are combinatorial (any subset can be active simultaneously), while editions are mutually exclusive (exactly one is active). Overloading `PropertyModification` would conflate these two models and complicate both the API contract and the resolution logic.

Each game has one canonical edition (typically the original printing). All other editions may have an `EditionDelta` describing how their properties differ from the canonical. The canonical edition has no delta -- it defines the baseline.

Edition selection is controlled via a query parameter (`edition` accepting a slug or UUID) that defaults to the canonical edition. The resolution pipeline becomes:

```
edition selection → edition delta → expansion resolution → experience adjustment → comparison
```

This slots in naturally before expansion resolution: first determine the base values for the selected edition, then apply expansion deltas on top of those values.

### Consequences

* Good, because edition-specific property differences become filterable -- a user can filter by the 2015 reprint's actual weight
* Good, because the delta pattern is consistent with expansion `PropertyModification` (same field names, same additive semantics)
* Good, because one-at-a-time selection means no combinatorial explosion -- the resolution cost is O(1) per edition
* Good, because it composes cleanly with the existing pipeline: edition deltas are applied before expansion resolution, which is applied before experience adjustment
* Good, because backward compatible -- games with no edition data or queries without an `edition` parameter behave identically to today
* Good, because both structured deltas (for filtering) and human-readable descriptions (for display) are supported
* Bad, because it adds one more resolution step to the effective-properties pipeline
* Bad, because the canonical edition requires curation -- someone must decide which printing is the baseline
* Bad, because edition delta data requires community contribution effort for each game with multiple printings

### Rejected Options

**Freeform notes** were rejected because unstructured text cannot participate in filtering. A note saying "slightly heavier than the original" is invisible to a weight filter query.

**Polymorphic PropertyModification** was rejected because it would add branching logic to every consumer of that schema. Expansion deltas and edition deltas have different cardinality constraints (many-of-many vs one-of-many), different resolution algorithms, and different API semantics. A shared schema would save a few lines of YAML but create ongoing confusion in documentation, client code, and the resolution pipeline.

## Implementation

### New Schemas

- `EditionDelta` -- Structured property deltas for a specific edition relative to the canonical edition, including numeric deltas and human-readable change descriptions

### API Changes

- New endpoint: `GET /games/{id}/editions` -- returns all editions of a game, optionally embedding delta data via `?include=deltas`
- New query parameter: `edition` on filtering endpoints -- selects the active edition for property resolution
- New include value: `edition_delta` for embedding in game responses

### Filter Composition

The edition delta inserts at the beginning of the resolution pipeline:

```
edition selection → edition delta → expansion resolution → experience adjustment → comparison
```

When `edition=samurai-2015-ffg` and `weight_max=3.0`:
1. Look up the edition delta for the 2015 FFG reprint
2. Apply the weight delta to the canonical base weight
3. Resolve expansion deltas if `effective=true` (ADR-0007)
4. Apply experience adjustment if `playtime_experience` is set (ADR-0034)
5. Compare the final resolved values against filter criteria
