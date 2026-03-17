---
status: accepted
date: 2026-03-12
---

# ADR-0010: Structured Per-Player-Count Polling Data

## Context and Problem Statement

Board games have a stated player count range (e.g., 2-5 players), but the quality of the experience varies dramatically by player count. A game that "supports" 2 players may be mediocre at 2 but outstanding at 4. Community polling data that captures per-player-count sentiment (best, recommended, not recommended) is essential for meaningful discovery. We need a data model that captures this nuance beyond simple min/max ranges.

## Decision Drivers

* "Best at 3 players" is fundamentally different from "supports 3 players" and the API must express this
* Poll data should support rich queries like "show me games that are best at exactly 2 players"
* The model must accommodate both publisher-stated ranges and community sentiment
* Data should be compatible with existing BGG poll data for migration purposes

## Considered Options

* Simple min/max player count range
* Weighted range with a single "sweet spot" indicator
* Per-player-count polls with best/recommended/not-recommended votes

## Decision Outcome

Chosen option: "Per-player-count polls with best/recommended/not-recommended votes", because it captures the full distribution of community sentiment at each player count and enables the richest possible filtering. Each game has a `player_count_polls` array where each entry contains a player count value and vote tallies for `best`, `recommended`, and `not_recommended`. This enables queries like "games that are best at exactly 3 players" (where `best` votes dominate at count=3) or "games to avoid at 2 players" (where `not_recommended` dominates at count=2). The simple range was rejected because it loses all quality-of-experience information. The weighted range was rejected because a single sweet spot cannot express bimodal distributions (e.g., great at 2 or 5, mediocre at 3-4).

### Consequences

* Good, because the full vote distribution enables precise filtering that no other board game API offers
* Good, because the data model is directly compatible with BGG's existing poll data, simplifying migration
* Good, because the poll structure naturally extends to other poll types (e.g., language dependence, age suitability)
* Bad, because per-player-count poll data is significantly more storage than a simple min/max range
* Bad, because games with few votes may have unreliable poll distributions, requiring a minimum vote threshold for filtering

## Future Considerations

[ADR-0043](0043-player-count-sentiment-model-improvements.md) adopts a numeric per-count rating model (1-5 scale) as the native replacement for the three-tier system documented here. The core decision of this ADR -- structured per-player-count sentiment data rather than simple min/max ranges -- carries forward. The change is in *how* sentiment is collected: independent numeric ratings per count rather than Best/Recommended/Not Recommended buckets. The BGG three-tier data is preserved as `PlayerCountPollLegacy` for migration compatibility.
