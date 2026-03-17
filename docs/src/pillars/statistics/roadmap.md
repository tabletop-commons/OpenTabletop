# Statistics Roadmap

The statistical foundation in the initial specification provides raw distributions, bulk export, and transparent derivations. The roadmap below describes planned extensions that build on this foundation -- informed by the expanded data model ([rating confidence](../data-model/rating-model.md), [dimensional weight](../data-model/weight-model.md), [player count sentiment](../data-model/player-count.md), [experience-bucketed playtime](../data-model/playtime.md), and [community signals](../../adr/0041-community-signals-and-aggregate-statistics.md)). These are not commitments -- they are directional goals that will go through the RFC governance process before being added to the specification.

## Near-Term: Cross-Sectional Trend Endpoints

**Status:** Planned for v1.0

Cross-sectional trends aggregate existing game data over `year_published` -- no new data collection required. Four endpoints:

- `GET /statistics/trends/publications` -- Games published per period, with average weight and rating. Filterable by mechanic, category, theme, funding source.
- `GET /statistics/trends/mechanics` -- Per-mechanic adoption curves (count and percentage of games per year). Tied to the taxonomy's phylogenetic model.
- `GET /statistics/trends/weight` -- Weight distribution over time (mean, median, percentiles). Scoped to top-100, all published, or full dataset.
- `GET /statistics/trends/player-count` -- Player count ranges and solo support percentage over time.

All trend endpoints compose with the standard [filter dimensions](../filtering/dimensions.md). The expanded data model enables additional trend dimensions: rating confidence trends, dimensional weight breakdowns, per-count player sentiment curves, and experience-adjusted playtime trends. See [Trend Analysis](./trends.md) for worked examples with JSON payloads, and [ADR-0036](../../adr/0036-time-series-snapshots-and-trend-analysis.md) for the design rationale.

## Near-Term: Parquet Export

**Status:** Planned for v1.1

JSON Lines and CSV cover the common cases, but data engineering workflows increasingly rely on columnar formats for analytical queries. Apache Parquet provides:

- **Columnar compression**: 5-10x smaller than JSON Lines for numerical data (vote counts, ratings, weights).
- **Predicate pushdown**: Query engines (DuckDB, Spark, BigQuery) can skip irrelevant columns and row groups without reading the entire file.
- **Type safety**: Schema is embedded in the file. Integers are integers, not strings that happen to contain digits.
- **Ecosystem support**: Parquet is readable by Pandas, Polars, R, DuckDB, Spark, Snowflake, BigQuery, Athena, and virtually every modern data tool.

The Parquet export will use the same `/export/games` endpoint with `format=parquet`. The `include` parameter (documented in [Data Export](./export.md)) controls which nested structures are populated. Full schema:

```
games.parquet
├── id (string, UUID)
├── slug (string)
├── name (string)
├── type (string, enum)
├── year_published (int32)
├── min_players (int32)
├── max_players (int32)
├── min_playtime (int32)
├── max_playtime (int32)
├── community_min_playtime (int32, nullable)
├── community_max_playtime (int32, nullable)
├── weight (float32)
├── weight_votes (int32)
├── average_rating (float32)
├── rating_count (int32)
├── rating_distribution (fixed_size_list<int32>[10])
├── rating_stddev (float32)
├── rating_confidence (float32)
├── rank_overall (int32, nullable)
├── community_suggested_age (int32, nullable)
├── owner_count (int32, nullable)
├── wishlist_count (int32, nullable)
├── total_plays (int32, nullable)
├── funding_source (string, nullable)
├── mechanics (list<string>)
├── categories (list<string>)
├── themes (list<string>)
├── player_count_ratings (list<struct>)
│   ├── player_count (int32)
│   ├── average_rating (float32)
│   ├── rating_count (int32)
│   └── rating_stddev (float32)
└── experience_playtime (struct, nullable)
    ├── levels (list<struct>)
    │   ├── experience_level (string, enum)
    │   ├── median_minutes (int32)
    │   ├── p10_minutes (int32)
    │   ├── p90_minutes (int32)
    │   └── report_count (int32)
    └── multipliers (struct, nullable)
        ├── first_play (float32)
        ├── learning (float32)
        ├── experienced (float32)
        └── expert (float32)
```

Key differences from earlier drafts: `player_count_ratings` uses the [ADR-0043](../../adr/0043-player-count-sentiment-model-improvements.md) numeric 1-5 model (average rating, count, stddev per player count), replacing the legacy BGG three-tier fields. Rating data is split into distribution, confidence, and stddev fields rather than a single `rating` float. Community signals (`owner_count`, `wishlist_count`, `total_plays`) and experience-bucketed playtime are included as first-class columns.

Nested structures (ratings, taxonomy lists, experience playtime) are stored as Parquet nested types, not flattened. This preserves the one-row-per-game structure while keeping relational data accessible to predicate pushdown.

## Near-Term: Longitudinal Snapshots

**Status:** Planned for v1.1

Longitudinal trends track the *same entities* over time. Unlike cross-sectional trends, they require new data -- periodic `GameSnapshot` records capturing a game's rating, weight, ranking, play count, and owner count at a specific date. Three endpoints:

- `GET /games/{id}/history` -- Time series of a single game's metrics over time.
- `GET /statistics/rankings/history` -- Historical ranking snapshots at a specific date.
- `GET /statistics/rankings/transitions` -- Games entering and exiting the top N over a date range.

See [Trend Analysis](./trends.md) for worked examples with JSON payloads. The `GameSnapshot` schema (`spec/schemas/GameSnapshot.yaml`) captures `average_rating`, `bayes_rating`, `rating_count`, `weight`, `weight_votes`, `rank_overall`, `rank_by_category`, `play_count_period`, and `owner_count`.

### Storage Considerations

Snapshot frequency is implementation-defined:

| Frequency | Rows/year (100k games) | Storage | Granularity |
|-----------|----------------------|---------|-------------|
| Monthly | 1.2M | ~500 MB | Best for short-term trends |
| Quarterly | 400k | ~170 MB | Good balance of cost and detail |
| Yearly | 100k | ~40 MB | Sufficient for long-term analysis |

Historical data before an implementation begins collecting snapshots is not available unless backfilled from external sources. Trend quality improves with history length.

## Mid-Term: Correlation APIs

**Status:** Under discussion

Pre-computed correlations between game properties, exposed as read-only, cacheable API endpoints updated periodically (not real-time). These provide the kind of aggregate analysis that currently requires downloading the full dataset and computing locally.

### Mechanic Co-occurrence

"What mechanics most commonly appear together?"

```http
GET /statistics/correlations/mechanics?mechanic=deck-building&limit=10
```

```json
{
  "mechanic": "deck-building",
  "cooccurrences": [
    { "mechanic": "hand-management", "count": 412, "jaccard": 0.38 },
    { "mechanic": "engine-building", "count": 287, "jaccard": 0.26 },
    { "mechanic": "drafting", "count": 198, "jaccard": 0.18 }
  ]
}
```

### Rating-by-Mechanic

"How have average ratings changed over time for cooperative games?"

```http
GET /statistics/trends/rating?mechanic=cooperative&group_by=year
```

```json
{
  "mechanic": "cooperative",
  "data": [
    { "period": 2008, "avg_rating": 6.8, "rating_count": 34, "avg_confidence": 0.42 },
    { "period": 2015, "avg_rating": 7.2, "rating_count": 156, "avg_confidence": 0.68 },
    { "period": 2020, "avg_rating": 7.0, "rating_count": 412, "avg_confidence": 0.61 },
    { "period": 2025, "avg_rating": 7.1, "rating_count": 342, "avg_confidence": 0.58 }
  ]
}
```

The 2020 dip in average confidence alongside rising game count reflects a flood of new cooperative titles that have not yet accumulated enough votes to stabilize.

### Rating Confidence Correlations

The [rating model](../data-model/rating-model.md) introduces a confidence score (0.0-1.0). Correlating confidence with other properties reveals data quality patterns:

```http
GET /statistics/correlations/confidence?group_by=funding_source
```

```json
{
  "data": [
    { "funding_source": "retail", "avg_confidence": 0.72, "avg_stddev": 1.4, "game_count": 18420 },
    { "funding_source": "kickstarter", "avg_confidence": 0.48, "avg_stddev": 1.9, "game_count": 3215 },
    { "funding_source": "gamefound", "avg_confidence": 0.41, "avg_stddev": 2.1, "game_count": 870 },
    { "funding_source": "self_published", "avg_confidence": 0.34, "avg_stddev": 2.3, "game_count": 1540 }
  ]
}
```

Crowdfunded and self-published games show systematically lower confidence and higher variance -- smaller voter populations and possible self-selection from backers who are already invested in the game's success.

- "Which mechanics or themes are associated with the most polarized ratings?" -- high stddev, low confidence.
- "Does rating confidence correlate with publication year?" -- newer games have less data, but the rate of convergence varies.

### Weight-by-Mechanic

"What is the average weight of games with each mechanic?"

```http
GET /statistics/correlations/weight-by-mechanic
```

```json
{
  "data": [
    { "mechanic": "worker-placement", "avg_weight": 3.21, "game_count": 1847, "weight_stddev": 0.72 },
    { "mechanic": "deck-building", "avg_weight": 2.54, "game_count": 1203, "weight_stddev": 0.68 },
    { "mechanic": "roll-and-write", "avg_weight": 1.82, "game_count": 624, "weight_stddev": 0.51 },
    { "mechanic": "wargame-hex-and-counter", "avg_weight": 3.89, "game_count": 312, "weight_stddev": 0.84 }
  ]
}
```

### Dimensional Weight Correlations

The [weight model](../data-model/weight-model.md) supports an optional 6-dimension breakdown (rules complexity, strategic depth, decision density, cognitive load, fiddliness, game length). Correlation endpoints can leverage these dimensions:

```http
GET /statistics/correlations/weight-dimensions?dimension=strategic_depth&sort_by=correlation
```

```json
{
  "dimension": "strategic_depth",
  "correlations": [
    { "mechanic": "engine-building", "correlation": 0.74, "avg_dimension_score": 3.8, "game_count": 1420 },
    { "mechanic": "worker-placement", "correlation": 0.71, "avg_dimension_score": 3.6, "game_count": 1847 },
    { "mechanic": "auction-bidding", "correlation": 0.65, "avg_dimension_score": 3.3, "game_count": 890 },
    { "mechanic": "roll-and-write", "correlation": 0.31, "avg_dimension_score": 2.1, "game_count": 624 }
  ]
}
```

- "Which mechanics correlate with high strategic depth but low fiddliness?" -- the "elegant complexity" query.
- "Which weight dimension correlates most strongly with overall rating?" -- testing whether strategic depth or rules complexity drives the documented complexity bias.

### Experience Playtime Correlations

The [experience-adjusted playtime model](../../adr/0034-experience-bucketed-playtime.md) captures per-game learning curves. Correlating multipliers with game properties answers:

```http
GET /statistics/correlations/experience-curve?sort_by=first_play_multiplier&order=desc
```

```json
{
  "data": [
    { "mechanic": "legacy", "avg_first_play_multiplier": 1.82, "avg_weight": 3.4, "game_count": 87 },
    { "mechanic": "engine-building", "avg_first_play_multiplier": 1.65, "avg_weight": 3.1, "game_count": 1420 },
    { "mechanic": "worker-placement", "avg_first_play_multiplier": 1.52, "avg_weight": 3.2, "game_count": 1847 },
    { "mechanic": "roll-and-write", "avg_first_play_multiplier": 1.18, "avg_weight": 1.8, "game_count": 624 }
  ]
}
```

Legacy games have the steepest first-play penalty (1.82x) despite moderate weight -- the campaign structure means first sessions include significant overhead that does not recur. Roll-and-write games have the flattest curve, confirming that low-fiddliness mechanics translate directly to faster onboarding.

### Community Engagement Correlations

[Community signals](../../adr/0041-community-signals-and-aggregate-statistics.md) (`owner_count`, `wishlist_count`, `total_plays`) enable engagement analysis:

```http
GET /statistics/correlations/engagement?metric=plays_per_owner&sort_by=desc
```

```json
{
  "metric": "plays_per_owner",
  "data": [
    { "game_slug": "codenames", "plays_per_owner": 18.4, "owner_count": 82100, "total_plays": 1510640 },
    { "game_slug": "7-wonders", "plays_per_owner": 12.7, "owner_count": 71200, "total_plays": 904240 },
    { "game_slug": "terraforming-mars", "plays_per_owner": 8.3, "owner_count": 94500, "total_plays": 784350 },
    { "game_slug": "gloomhaven", "plays_per_owner": 4.1, "owner_count": 68400, "total_plays": 280440 }
  ]
}
```

*Codenames* at 18.4 plays per owner versus *Gloomhaven* at 4.1 illustrates the replayability spectrum -- party games get replayed constantly while campaign games are played through once. This is a signal that rating alone does not capture.

- "Which wishlisted games convert to purchases fastest?" -- wishlist-to-owner velocity.
- "Do lighter games get played more often per owner, or does engagement correlate with weight?"

## Long-Term: Recommendation Engine Foundation

**Status:** Exploratory

The data model and export system provide the raw materials for recommendation engines, but the specification intentionally does not define a recommendation algorithm. Recommendations are subjective and application-specific -- "similar games" means different things to different users.

What the specification *can* provide:

- **Feature vectors**: A standardized game feature vector that recommendation engines can use as input. The expanded data model provides much richer signals than a simple mechanics-and-weight vector:
  - Mechanics bitmap (unchanged)
  - Dimensional weight profile (6 independent dimensions, not just the composite score)
  - Player count sentiment curve (per-count 1-5 ratings from [ADR-0043](../../adr/0043-player-count-sentiment-model-improvements.md), not just min/max)
  - Rating confidence score (distinguishes well-understood games from noisy or polarized ones)
  - Experience playtime multipliers (characterizes the learning curve shape)
  - Community engagement signals (plays-per-owner ratio, owner velocity)
- **Similarity endpoint**: A `/games/{id}/similar` endpoint that returns games with high feature-vector similarity, using a documented distance metric (e.g., cosine similarity). Dimensional weight and player count curves provide much richer similarity signals than the earlier mechanics-bitmap approach.
- **User preference profiles**: A schema for expressing user preferences that implementations can use to personalize results. Preferences can now include weight dimension priorities (e.g., "I value strategic depth but dislike fiddliness"), experience-adjusted time constraints ("games that fit in 90 minutes for a first play"), and player count quality thresholds ("best at exactly 2, not just supports 2").

The key principle: the specification defines the *inputs* to recommendation (feature vectors, similarity metrics), not the *outputs* (personalized ranked lists). Implementations are free to build sophisticated recommendation systems on top of the specification's data.

## Long-Term: Data Quality Analytics

**Status:** Exploratory

Analytics about the data itself -- not about games, but about the health and completeness of the dataset. These help the community prioritize curation effort and track data maturity over time.

```http
GET /statistics/data-quality
```

```json
{
  "snapshot_date": "2026-03-01",
  "resolution_tiers": {
    "games_with_expansions": 8420,
    "tier_1_explicit_pct": 12.4,
    "tier_2_computed_pct": 31.2,
    "tier_3_base_only_pct": 56.4
  },
  "rating_confidence": {
    "above_0_7_pct": 34.8,
    "between_0_4_and_0_7_pct": 41.2,
    "below_0_4_pct": 24.0
  },
  "player_count_ratings": {
    "native_numeric_pct": 28.6,
    "legacy_three_tier_only_pct": 52.1,
    "no_data_pct": 19.3
  },
  "experience_playtime": {
    "sufficient_data_pct": 18.4,
    "partial_data_pct": 22.7,
    "no_data_pct": 58.9
  }
}
```

Each section maps to a curation priority:

- **Resolution tier distribution**: What percentage of games with expansions have tier 1 (explicit `ExpansionCombination`), tier 2 (computed deltas), or tier 3 (base game only) effective-mode data? A dashboard showing "87% of games with expansions have only tier 3 data" motivates contributors to curate combination records.
- **Rating confidence distribution**: What percentage of games have confidence above 0.7? How does this break down by publication decade or game type? Tracks overall data maturity.
- **Player count rating coverage**: What percentage of games have native numeric per-count ratings ([ADR-0043](../../adr/0043-player-count-sentiment-model-improvements.md)) vs. only legacy three-tier data vs. no player count data at all? Tracks migration progress.
- **Experience playtime coverage**: What percentage of games have `sufficient_data: true` for experience-bucketed playtime? Which weight tiers or mechanics have the worst coverage?

## Contributing to the Roadmap

All roadmap items will go through the RFC process described in the [Governance Model](../../governance.md). To propose a new statistical feature:

1. Open a discussion issue describing the use case and the data required.
2. If there is community interest, draft an RFC with the proposed schema, endpoints, and export format.
3. The RFC goes through the standard review and approval process.

The statistical foundation is designed to be extended. The core data structures (polls, distributions, deltas) are stable; the analytical endpoints built on top of them are where the roadmap lives.
