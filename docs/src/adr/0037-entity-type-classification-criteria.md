---
status: proposed
date: 2026-03-15
---

# ADR-0037: Formal Entity Type Classification Criteria

## Context and Problem Statement

The specification defines six game entity types via [ADR-0006](0006-unified-game-entity.md) (`base_game`, `expansion`, `standalone_expansion`, `promo`, `accessory`, `fan_expansion`) and an edition/version system via [ADR-0035](0035-edition-level-property-deltas.md) (`GameEdition` + `EditionDelta`). However, there is no formal decision framework for classifying products into these types or for determining when a product should be a new entity versus a new edition of an existing one.

This mirrors real-world classification problems observed in BoardGameGeek, where:

- Promos and accessories are frequently conflated (a single promo card listed as an accessory, or vice versa)
- Standalone expansions are inconsistently classified as base games or expansions
- Remakes and reprints get separate entries when they should be editions of the same entity
- New entries are created for products that should be attached to a base game
- Fan content classification is ad hoc

Without formal criteria, contributors and data curators will reproduce these same inconsistencies. The project needs a decision tree and grey zone rules analogous to the taxonomy classification criteria (`taxonomy-criteria.md`), but for entity types and the entity-vs-edition boundary.

## Decision Drivers

* Contributors and RFC reviewers need objective, repeatable criteria for type assignment
* The BGG data migration pipeline ([ADR-0032](0032-strangler-fig-legacy-migration.md)) requires deterministic mapping rules for ambiguous BGG entries
* Six grey zone boundaries (promo/accessory, expansion/standalone_expansion, base_game/standalone_expansion, new entity/new edition, expansion/fan_expansion, big promo/small expansion) each need an explicit decision rule
* The edition system ([ADR-0035](0035-edition-level-property-deltas.md)) introduced a "new entity vs new edition" boundary with no documented resolution criteria
* Consistency with the taxonomy classification criteria pattern keeps documentation uniform

## Considered Options

* **Informal guidelines** — Expand the existing type discriminator table in `games.md` with longer descriptions and examples
* **Formal classification criteria as a dedicated documentation page with ADR** — Create a full decision tree, grey zone rules, worked examples, BGG migration mapping, and RFC reviewer checklist
* **Algorithmic classification** — Define programmatic rules that automatically assign types during data import

## Decision Outcome

Chosen option: "Formal classification criteria as a dedicated documentation page with ADR," because repeatable, human-readable criteria serve both human contributors (RFC review, data correction) and automated import pipelines (BGG migration). The criteria document follows the established pattern of `taxonomy-criteria.md`: a mermaid decision tree flowchart, grey zone rules with worked examples, and an RFC reviewer checklist.

Informal guidelines were rejected because they lack the structure needed for consistent review decisions across contributors. Fully algorithmic classification was rejected because grey zone cases inherently require human judgment — the criteria guide that judgment rather than replace it.

### Consequences

* Good, because contributors and reviewers have a single reference document for type decisions
* Good, because the BGG migration pipeline can reference the same criteria for deterministic import rules
* Good, because the "new entity vs new edition" boundary is formally documented alongside the type boundary
* Good, because the pattern matches `taxonomy-criteria.md`, keeping documentation consistent
* Good, because the criteria compose with the relationship type system ([ADR-0011](0011-typed-game-relationships.md)) — the decision tree references relationship types as outputs
* Bad, because edge cases will inevitably arise that the criteria do not cover — the document must evolve via RFC
* Bad, because retroactive reclassification of imported data may be needed as criteria are refined

## Implementation

The companion documentation page at `docs/src/pillars/data-model/entity-type-criteria.md` contains:

- Summary table of the six entity types with defining questions and characteristics
- Primary decision tree (mermaid flowchart) for entity type classification
- Entity vs edition decision tree for the new-entity/new-edition boundary
- Worked examples for all six types (clear cases) and six grey zone boundaries
- Seven numbered grey zone rules with explicit tests
- BGG migration mapping table with deterministic import rules
- Nine-item RFC reviewer checklist for entity classification review
