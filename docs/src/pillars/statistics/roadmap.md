# Statistics Roadmap

The statistical foundation in the initial specification provides raw distributions, bulk export, and transparent derivations. The roadmap below describes planned extensions that build on this foundation. These are not commitments — they are directional goals that will go through the RFC governance process before being added to the specification.

## Near-Term: Parquet Export

**Status:** Planned for v1.1

JSON Lines and CSV cover the common cases, but data engineering workflows increasingly rely on columnar formats for analytical queries. Apache Parquet provides:

- **Columnar compression**: 5-10x smaller than JSON Lines for numerical data (vote counts, ratings, weights).
- **Predicate pushdown**: Query engines (DuckDB, Spark, BigQuery) can skip irrelevant columns and row groups without reading the entire file.
- **Type safety**: Schema is embedded in the file. Integers are integers, not strings that happen to contain digits.
- **Ecosystem support**: Parquet is readable by Pandas, Polars, R, DuckDB, Spark, Snowflake, BigQuery, Athena, and virtually every modern data tool.

The Parquet export will use the same `/export/games` endpoint with `format=parquet`. Schema:

```
games.parquet
├── id (string, UUID)
├── slug (string)
├── name (string)
├── type (string, enum)
├── year_published (int32)
├── min_players (int32)
├── max_players (int32)
├── weight (float32)
├── rating (float32)
├── mechanics (list<string>)
├── categories (list<string>)
├── themes (list<string>)
└── player_count_polls (list<struct>)
    ├── player_count (int32)
    ├── best_votes (int32)
    ├── recommended_votes (int32)
    └── not_recommended_votes (int32)
```

Nested structures (polls, taxonomy lists) are stored as Parquet nested types, not flattened. This preserves the one-row-per-game structure while keeping relational data accessible.

## Mid-Term: Correlation APIs

**Status:** Under discussion

Pre-computed correlations between game properties, exposed as API endpoints:

### Mechanic Co-occurrence

"What mechanics most commonly appear together?"

```http
GET /statistics/mechanics/cooccurrence?mechanic=deck-building&limit=10
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

### Weight-by-Mechanic

"What is the average weight of games with each mechanic?"

```http
GET /statistics/mechanics/weight-distribution
```

### Rating Trends

"How have average ratings changed over time for cooperative games?"

```http
GET /statistics/trends/rating?mechanics=cooperative&group_by=year
```

These endpoints provide the kind of aggregate analysis that currently requires downloading the full dataset and computing locally. They are read-only, cacheable, and updated periodically (not real-time).

## Long-Term: Recommendation Engine Foundation

**Status:** Exploratory

The data model and export system provide the raw materials for recommendation engines, but the specification intentionally does not define a recommendation algorithm. Recommendations are subjective and application-specific — "similar games" means different things to different users.

What the specification *can* provide:

- **Feature vectors**: A standardized game feature vector (mechanics bitmap, weight, player counts, themes) that recommendation engines can use as input.
- **Similarity endpoint**: A `/games/{id}/similar` endpoint that returns games with high feature-vector similarity, using a documented distance metric (e.g., cosine similarity on the feature vector).
- **User preference profiles**: A schema for expressing user preferences (liked games, preferred mechanics, weight range) that implementations can use to personalize results.

The key principle: the specification defines the *inputs* to recommendation (feature vectors, similarity metrics), not the *outputs* (personalized ranked lists). Implementations are free to build sophisticated recommendation systems on top of the specification's data.

## Long-Term: Time-Series Data

**Status:** Exploratory

Board game data changes over time. Ratings shift as a game ages. Weight perceptions change as the community learns the game. New expansions alter the landscape. Time-series data would capture these dynamics:

- **Rating over time**: Monthly average rating for each game, enabling "is this game aging well?" analysis.
- **Weight drift**: Weight votes over time, capturing whether community consensus on complexity shifts.
- **Play frequency**: Number of logged plays per month, indicating whether a game has staying power or fades quickly after release.
- **Expansion impact**: How do ratings and play counts change when a major expansion releases?

Time-series data is expensive to store and compute. It is the furthest-out item on the roadmap and would require careful design around storage costs, update frequency, and API ergonomics.

## Contributing to the Roadmap

All roadmap items will go through the RFC process described in the [Governance Model](../../governance.md). To propose a new statistical feature:

1. Open a discussion issue describing the use case and the data required.
2. If there is community interest, draft an RFC with the proposed schema, endpoints, and export format.
3. The RFC goes through the standard review and approval process.

The statistical foundation is designed to be extended. The core data structures (polls, distributions, deltas) are stable; the analytical endpoints built on top of them are where the roadmap lives.
