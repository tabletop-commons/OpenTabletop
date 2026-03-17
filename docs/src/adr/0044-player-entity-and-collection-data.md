---
status: proposed
date: 2026-03-16
---

# ADR-0044: Player Entity and Collection Data

## Context and Problem Statement

The specification models games comprehensively -- entities, relationships, expansions, editions, taxonomy -- and captures community opinions about games via ratings, weight votes, player count assessments, and play time logs. But it does not model the *people who hold those opinions*.

Every data quality problem documented across the rating model, weight model, and player count model traces to the same root cause: all voters are treated as interchangeable. A first-time casual gamer's weight vote counts the same as a 20-year veteran's. A voter who uses a 1-5 rating scale is averaged with one who uses 6-10. A rating from someone who played once is indistinguishable from someone who played 50 times. Without a Player entity, these differences are invisible.

Additionally, collection data (owned, wishlisted, for trade) and play logs are currently proposed as aggregate counts on the Game entity ([ADR-0041](0041-community-signals-and-aggregate-statistics.md)), but they are fundamentally per-player data. The aggregate is derived from the individual; the specification should model both.

## Decision Drivers

* Every community-sourced metric (rating, weight, player count, playtime) is an opinion from a specific person with specific context -- modeling that person enables vote weighting, bias detection, and corpus-based analysis
* The voter-declared scale in the [Rating Model](../pillars/data-model/rating-model.md) is a per-player attribute, not per-vote -- it belongs on a persistent Player entity
* Collection states (owned, wishlist, for_trade) are per-player relationships to games, not game-level properties -- the game-level aggregates in ADR-0041 are derived from this underlying data
* Play logs with context (player count, experience level, duration, expansions used) are the foundation for community playtime data, experience-bucketed playtime ([ADR-0034](0034-experience-bucketed-playtime.md)), and engagement metrics
* Corpus-based filtering ("what do players like me think?") is a fundamentally more useful question than "what does the undifferentiated crowd think?" -- and it requires knowing who the voters are
* Privacy must be opt-in: anonymous voting remains valid, Player profiles are voluntary

## Considered Options

* **No Player entity** -- Continue treating all voters as interchangeable; capture per-vote context metadata without linking to a persistent identity
* **Minimal Player entity** -- ID, username, declared preferences, collection states, play logs; no derived profiles or archetypes
* **Full Player entity with derived taste profiles and archetype clustering** -- Persistent identity with collection, play history, declared preferences, plus derived behavioral profiles

## Decision Outcome

Chosen option: "Full Player entity with derived taste profiles and archetype clustering," because the value of Player data is primarily in the *derived* insights (taste profiles, archetype clustering, corpus-based filtering), not just the raw fields. A minimal entity without derived attributes would store collection data but miss the analytical potential that motivated this ADR.

The per-vote context metadata approach was rejected because context without identity loses continuity -- a voter's scale preference, experience trajectory, and taste profile are longitudinal attributes that only make sense when linked across votes over time.

### Consequences

* Good, because every community-sourced metric can be contextualized by who submitted it -- enabling vote weighting, bias quantification, and audience segmentation
* Good, because the voter-declared rating scale has a natural home on the Player entity rather than being repeated per-vote
* Good, because collection data and play logs are modeled at the correct level (per-player) with game-level aggregates derived from them
* Good, because corpus-based filtering ("what do players like me think?") becomes possible -- a capability no existing board game API offers
* Good, because archetype-based analysis gives publishers real audience insight ("what kind of player rates my game highly?")
* Bad, because Player data introduces privacy obligations -- the specification must define opt-in, anonymization, and data deletion principles
* Bad, because derived attributes (taste profiles, archetypes) require implementation-level computation that the spec can describe but not mandate
* Bad, because the entity significantly expands the specification's scope from "game data" to "game data + user data"

## Implementation

See [Players & Collections](../pillars/data-model/players.md) for the full entity documentation including:
- Player entity fields
- Collection states and demand signal derivation
- Play log schema
- Taste profile derivation
- Archetype clustering
- Privacy principles
- Relationship to existing models (rating, weight, player count, playtime, age recommendation)
