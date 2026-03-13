---
status: accepted
date: 2026-03-12
---

# ADR-0007: Combinatorial Expansion Property Model

## Context and Problem Statement

When expansions are combined with a base game, the resulting gameplay properties (player count, playtime, weight, mechanics) may differ from the simple sum of base and expansion values. For example, combining two specific expansions might unlock a player count or mechanic that neither provides individually. We need a model that captures these emergent combination effects while keeping the common case (simple additive deltas) easy to manage.

## Decision Drivers

* Most expansion effects are simple additive deltas (e.g., "+2 max players") and should be easy to express
* Some expansion combinations produce emergent properties that cannot be derived by summing deltas
* API consumers need to know whether a property came from an explicit combination record or was computed
* The model must not require a full matrix of all possible combinations (combinatorial explosion)

## Considered Options

* Simple additive deltas only — each expansion declares its delta from the base game
* ExpansionCombination entity for explicit combo effects with additive delta fallback
* Full combination matrix precomputing all possible expansion sets

## Decision Outcome

Chosen option: "ExpansionCombination entity with additive delta fallback", because it handles the common case simply while supporting emergent combination effects where they exist. The resolution follows a three-tier hierarchy: (1) if an explicit ExpansionCombination record exists for the requested set of expansions, use it; (2) otherwise, sum the individual expansion deltas with the base game properties; (3) if no delta information exists, return base game properties only. Every response includes a `combination_source` flag indicating which tier produced the values (`explicit_combination`, `delta_sum`, or `base_only`). The full matrix approach was rejected because the number of possible expansion combinations grows exponentially and most combinations have no emergent effects.

### Consequences

* Good, because the common case (additive deltas) requires no extra data entry beyond the expansion's own properties
* Good, because emergent combination effects can be explicitly recorded when discovered
* Good, because the `combination_source` flag gives consumers transparency into the data quality
* Bad, because explicit combination records must be manually created and maintained by contributors
* Bad, because three-tier resolution adds complexity to the query engine
