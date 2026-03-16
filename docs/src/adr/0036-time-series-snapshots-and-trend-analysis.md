---
status: proposed
date: 2026-03-15
---

# ADR-0036: Time-Series Snapshots and Trend Analysis

## Context and Problem Statement

The specification currently captures board game data as a static snapshot — what games exist, their properties, and their ratings *right now*. But the hobby is a living ecosystem with dramatic shifts over time: ranking eras (Twilight Imperium → Gloomhaven → Brass: Birmingham), mechanic waves (deck-building after Dominion, cooperative after Pandemic, legacy after Risk Legacy), publishing disruption (Kickstarter's rise from 2012 onward), and demographic broadening. None of these dynamics are queryable today.

Two distinct types of trend analysis exist:

1. **Cross-sectional trends** — aggregating existing game data over `year_published` to answer questions like "how many cooperative games were published per year?" or "what's the average weight of games published each decade?" These require no new data model — only aggregate query endpoints over existing fields.

2. **Longitudinal trends** — tracking the same entities over time to answer questions like "what was BGG #1 in 2019?" or "how did Gloomhaven's rating change from 2018 to 2024?" These require periodic snapshots of game metrics — new data that does not exist in the current model.

The specification needs to support both types of trend analysis while keeping the data model manageable and storage costs proportional to value.

## Decision Drivers

* Cross-sectional trends are derivable from existing data and should be available in v1.0 without new schemas
* Longitudinal trends require new data (periodic snapshots) and have significant storage implications
* The hobby's evolution is a primary motivation for many data consumers (researchers, journalists, recommendation engines)
* Trend endpoints should compose with existing filter dimensions where applicable
* Storage costs for longitudinal snapshots grow linearly with dataset size × snapshot frequency
* The specification should define the contract without mandating a specific snapshot cadence
* Trend data ties naturally to the taxonomy's phylogenetic model (mechanic origin games are industry inflection points)

## Considered Options

* **Cross-sectional only** — Define aggregate endpoints over `year_published` and defer all longitudinal analysis
* **Full snapshot model** — Define both `GameSnapshot` (per-game time series) and `HobbySnapshot` (aggregate time series) schemas with dedicated endpoints for both cross-sectional and longitudinal queries
* **Event-sourced model** — Store every rating/vote/play as an immutable event and derive trends from the event stream

## Decision Outcome

Chosen option: "Full snapshot model," because it provides the most useful trend analysis with manageable complexity. Cross-sectional trends use existing data with new aggregate endpoints. Longitudinal trends use a new `GameSnapshot` schema that captures periodic metric snapshots at implementation-defined intervals.

The event-sourced model was considered but rejected — it provides maximum granularity at the cost of extreme storage requirements and query complexity. Periodic snapshots (monthly or quarterly) capture the trends that matter while keeping storage bounded.

Cross-sectional trend endpoints are specified for v1.0. Longitudinal snapshot storage and query endpoints are specified for v1.1, giving implementations time to build snapshot infrastructure.

### Consequences

* Good, because cross-sectional trends are immediately available from existing data — no migration or new data collection needed
* Good, because longitudinal snapshots enable "rating over time," "ranking history," and "mechanic popularity wave" analysis
* Good, because the snapshot approach bounds storage costs — one record per game per snapshot period, not one per rating event
* Good, because trend endpoints compose with existing filter dimensions (filter by mechanic, category, year range, etc.)
* Good, because the specification defines the contract (schema, endpoints, response format) without mandating snapshot frequency, letting implementations choose monthly/quarterly/yearly based on their resources
* Bad, because longitudinal analysis requires implementations to collect and store snapshot data over time — trend quality improves with history length
* Bad, because snapshot granularity is a trade-off: monthly snapshots for 100k games = 1.2M rows/year; quarterly reduces this to 400k
* Bad, because historical snapshot data before an implementation starts collecting is not available unless backfilled from external sources

### Rejected Options

**Cross-sectional only** was rejected because it cannot answer the most compelling trend questions — ranking trajectories, rating drift, expansion impact over time. These longitudinal questions are a primary use case for researchers and data journalists.

**Event-sourced model** was rejected because it requires storing every individual rating, vote, and play log as an immutable event. For a dataset with millions of ratings, this produces a write-heavy, storage-intensive system that is architecturally incompatible with the specification's read-optimized design. Periodic snapshots capture 99% of the analytical value at 1% of the storage cost.

## Implementation

### New Schemas

- `GameSnapshot` — A point-in-time capture of a single game's metrics (rating, weight, rank, play count, owner count) at a specific date. One record per game per snapshot period.
- `TrendDataPoint` — An aggregate data point for cross-sectional trend queries, containing year/period, count, and statistical summaries (mean, median, percentiles).

### Cross-Sectional Trend Endpoints (v1.0)

These aggregate over existing game data grouped by `year_published`:

- `GET /statistics/trends/publications` — Games published per year/decade, filterable by mechanic/category/theme
- `GET /statistics/trends/mechanics` — Mechanic adoption over time (count and percentage per year)
- `GET /statistics/trends/weight` — Weight distribution over time (mean, median, percentiles), scoped to top-N, all, or published-that-year
- `GET /statistics/trends/player-count` — Player count trends (average min/max, solo support percentage)

### Longitudinal Endpoints (v1.1)

These query `GameSnapshot` data:

- `GET /games/{id}/history` — Time series of a single game's metrics (rating, weight, rank, play count)
- `GET /statistics/rankings/history` — Historical ranking snapshots (top N at a given date)
- `GET /statistics/rankings/transitions` — Games entering/exiting the top N over a date range

### Game Schema Addition

An optional `funding_source` field on the `Game` entity enables crowdfunding trend analysis:

```yaml
funding_source:
  type: string
  enum: [retail, kickstarter, gamefound, backerkit, self_published, other]
  nullable: true
```
