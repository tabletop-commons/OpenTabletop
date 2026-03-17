# Data Structures

The statistical foundation is built on specific data structures that capture community opinion as raw distributions rather than pre-computed summaries.

## Player Count Ratings

The player count rating is the most important statistical data structure in the specification. For each game and each supported player count, it records a numeric community rating on a 1-5 scale -- not categorical buckets, but real numbers that support standard statistical analysis. See [Player Count Model](../data-model/player-count.md) for the full design rationale.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `player_count` | integer | The specific player count (1, 2, 3, ...) |
| `average_rating` | float (1.0-5.0) | Mean community rating at this player count |
| `rating_count` | integer | Number of votes at this player count |
| `rating_stddev` | float | Standard deviation (consensus vs polarization) |

### Example: *Lost Ruins of Arnak*

| Player Count | Avg Rating | Votes | Std Dev | Signal |
|-------------|-----------|-------|---------|--------|
| 1 | 3.4 / 5 | 876 | 1.0 | Decent solo -- AI opponent works but lacks tension |
| 2 | 4.5 / 5 | 1,234 | 0.6 | Strong consensus -- the sweet spot |
| 3 | 4.2 / 5 | 1,089 | 0.7 | Great, slightly more downtime than 2 |
| 4 | 3.1 / 5 | 745 | 1.1 | Acceptable but downtime becomes noticeable |

From this raw data, a consumer can derive:

- **Highest rated at 2** (4.5/5 with tight consensus at std dev 0.6).
- **Well-rated at 2-3**: Both above 4.0, the "highly rated" threshold.
- **4 is acceptable but divisive** (3.1/5 with high std dev) -- the added downtime between turns divides opinion.
- **Solo is middling** (3.4/5) -- the AI opponent is functional but lacks the competitive tension of multiplayer.

Different applications set different thresholds. A hardcore strategy app might set "recommended" at 4.0+; a family app might set it at 3.0+. The raw numeric data supports any interpretation -- no fixed categories constrain the analysis.

### Accessing Rating Data

```http
GET /games/lost-ruins-of-arnak/player-count-ratings
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000095",
  "ratings": [
    { "player_count": 1, "average_rating": 3.4, "rating_count": 876, "rating_stddev": 1.0 },
    { "player_count": 2, "average_rating": 4.5, "rating_count": 1234, "rating_stddev": 0.6 },
    { "player_count": 3, "average_rating": 4.2, "rating_count": 1089, "rating_stddev": 0.7 },
    { "player_count": 4, "average_rating": 3.1, "rating_count": 745, "rating_stddev": 1.1 }
  ]
}
```

### BGG Legacy Data

For data migrated from BoardGameGeek, the `PlayerCountPollLegacy` schema preserves BGG's three-tier voting model (Best / Recommended / Not Recommended). This data is available via the API but is not the native model -- it is maintained for backward compatibility and transparency during migration. Legacy three-tier data can be converted to approximate numeric ratings for unified querying. See [Player Count Model: BGG Legacy Data](../data-model/player-count.md#bgg-legacy-data).

## Weight Votes

The `weight` field on a Game is an average. The weight vote distribution provides the underlying data.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `votes` | object | Map of weight value (string) to vote count |
| `total_votes` | integer | Sum of all votes |
| `average` | float | Computed average (same as Game.weight) |

### Example: *Great Western Trail*

*Great Western Trail*'s weight is concentrated in the 3.5-4.0 range, reflecting strong agreement that the game sits firmly in the "heavy-medium" band. The tight cluster suggests voters -- despite varying experience levels -- perceive the game's complexity similarly. The small tail of 1.0-2.0 votes may reflect voters who found the cattle-market loop more intuitive than the weight suggests.

A bimodal distribution (many 2.0 votes and many 4.0 votes) would suggest the game's complexity is debated, which is useful information that an average hides.

### Dimensional Weight Data

Implementations that support the [detailed weight mode](../data-model/weight-model.md#detailed-mode-dimensional-survey) store per-dimension vote distributions -- rules complexity, strategic depth, decision density, cognitive load, fiddliness, and game length -- each rated independently on a 1-5 scale. These per-dimension distributions are exportable alongside the composite weight distribution, enabling analyses like "which games have high strategic depth but low fiddliness?" that a single composite number cannot answer.

### Accessing Weight Distribution

```http
GET /games/great-western-trail/weight-votes
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000090",
  "votes": {
    "1.0": 5,
    "1.5": 3,
    "2.0": 18,
    "2.5": 67,
    "3.0": 312,
    "3.5": 1489,
    "4.0": 2134,
    "4.5": 876,
    "5.0": 142
  },
  "total_votes": 5046,
  "average": 3.72
}
```

## Rating Distribution

The `average_rating` on a Game is a single number that hides the distribution shape. The rating distribution exposes the full histogram of voter opinion, a confidence score, and standard deviation. See [Rating Model](../data-model/rating-model.md) for the four-layer rating architecture.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `average_rating` | float (1-10) | Arithmetic mean of normalized ratings |
| `rating_count` | integer | Total number of ratings |
| `rating_distribution` | integer[10] | Histogram: vote count at each 1-10 bucket |
| `rating_stddev` | float | Standard deviation of the distribution |
| `confidence` | float (0.0-1.0) | Spec-defined confidence score |

### Example: *Dune: Imperium*

The distribution reveals what the average hides:

- **Bell curve centered at 8-9** -- strong consensus that this is a top-tier game.
- **Low std dev (1.38)** -- voters agree. Compare to a brigaded game where std dev exceeds 3.5.
- **High confidence (0.86)** -- large sample, tight consensus. This number is trustworthy.

A bimodal distribution (peaks at 3 and 9) would indicate a polarizing game -- some love it, some hate it. The average might be 6.0 in both cases, but the distribution shape tells a completely different story.

The confidence score (0.0-1.0) synthesizes sample size, distribution shape, and deviation from the global mean into a single trust signal. See [Rating Model: Confidence Score](../data-model/rating-model.md#layer-3-confidence-score) for the formula, and the [pre-release brigading case study](../data-model/rating-model.md#case-study-pre-release-brigading) for a real-world example where confidence correctly flags a meaningless rating.

### Accessing Rating Distribution

```http
GET /games/dune-imperium/rating-distribution
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000091",
  "average_rating": 8.32,
  "rating_count": 42876,
  "rating_distribution": [98, 112, 245, 502, 1234, 3456, 8912, 14567, 10234, 3516],
  "rating_stddev": 1.38,
  "confidence": 0.86
}
```

## Community Age Poll

The community age poll captures voter recommendations for the minimum appropriate age for a game. Unlike player count ratings (which use a numeric scale), age polls are simple: voters pick the minimum age they would suggest. The distribution reveals how the community's view compares to the publisher's box rating. See [Age Recommendation Model](../data-model/age-recommendation.md).

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `suggested_age` | integer | The minimum age voters selected |
| `vote_count` | integer | Number of voters who selected this age |

The Game entity includes a derived field:

| Field | Type | Description |
|-------|------|-------------|
| `community_suggested_age` | integer (nullable) | Median of all age votes |

### Example: *Viticulture*

The publisher rates *Viticulture* at 13+. The community sees it differently:

| Suggested Age | Votes |
|---------------|-------|
| 8 | 34 |
| 10 | 189 |
| 12 | 312 |
| 14 | 87 |
| 16 | 11 |

The community suggested age is **12** -- one year lower than the publisher's box rating. Despite the wine theme, the gameplay is abstract enough (place workers, collect resources, fill orders) that voters consider the mechanics accessible to a 12-year-old. The publisher's conservative 13+ likely reflects the thematic subject matter rather than mechanical complexity. The gap between "thematically appropriate" and "mechanically capable" is exactly the kind of nuance the community poll captures.

### Accessing Age Poll Data

```http
GET /games/viticulture/age-poll
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000092",
  "community_suggested_age": 12,
  "votes": [
    { "suggested_age": 8, "vote_count": 34 },
    { "suggested_age": 10, "vote_count": 189 },
    { "suggested_age": 12, "vote_count": 312 },
    { "suggested_age": 14, "vote_count": 87 },
    { "suggested_age": 16, "vote_count": 11 }
  ],
  "total_votes": 633
}
```

## Community Play Time Data

Community-reported play times are derived from individual play logs. The statistical foundation exposes aggregate data.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game |
| `total_plays` | integer | Number of plays with reported duration |
| `min_reported` | integer | Minimum reported play time (minutes) |
| `max_reported` | integer | Maximum reported play time (minutes) |
| `median` | integer | Median play time (minutes) |
| `p10` | integer | 10th percentile |
| `p25` | integer | 25th percentile |
| `p75` | integer | 75th percentile |
| `p90` | integer | 90th percentile |
| `by_player_count` | object | Median play time broken down by player count |

### Example: *Concordia*

This data shows what the publisher's single estimate cannot capture:
- The publisher says 100 minutes. The community median is 105 -- unusually close for a strategy game.
- 2-player games are fast (70 min median) -- *Concordia* scales well downward.
- 5-player games take over twice as long as 2-player (155 vs 70 min) -- the scaling factor is dramatic.
- The 90th percentile is 160 minutes -- some groups spend nearly 3 hours.
- The per-player-count breakdown reveals that player count is the dominant factor in play time.

### Accessing Play Time Data

```http
GET /games/concordia/community-playtime
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000093",
  "total_plays": 6234,
  "min_reported": 40,
  "max_reported": 240,
  "median": 105,
  "p10": 65,
  "p25": 80,
  "p75": 130,
  "p90": 160,
  "by_player_count": {
    "2": { "median": 70, "plays": 2845 },
    "3": { "median": 100, "plays": 1987 },
    "4": { "median": 125, "plays": 1134 },
    "5": { "median": 155, "plays": 268 }
  }
}
```

## Experience Playtime Poll

The experience playtime poll captures community-reported play times bucketed by player experience level. Like PlayerCountRating, it stores raw distributions rather than pre-computed summaries. See ADR-0034.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `experience_level` | string | `first_play`, `learning`, `experienced`, or `expert` |
| `median_minutes` | integer | Median reported play time for this level |
| `min_minutes` | integer | 10th percentile play time |
| `max_minutes` | integer | 90th percentile play time |
| `total_reports` | integer | Number of contributing play reports |

### Example: *Gloomhaven: Jaws of the Lion*

| Level | Median | p10 | p90 | Reports |
|-------|--------|-----|-----|---------|
| first_play | 120 min | 90 min | 180 min | 456 |
| learning | 90 min | 65 min | 130 min | 712 |
| experienced | 70 min | 50 min | 100 min | 1,534 |
| expert | 55 min | 40 min | 80 min | 389 |

From this data, multipliers are derived: first_play = 120/70 = 1.71, expert = 55/70 = 0.79. This tells consumers that a first scenario of *Gloomhaven: Jaws of the Lion* takes 71% longer than an experienced play -- the tutorial scenarios help, but the card combo system and enemy AI rules create a steep initial learning curve. By expert level, optimized play and familiar monster patterns cut session time significantly.

### Accessing Experience Playtime Data

```http
GET /games/gloomhaven-jaws-of-the-lion/experience-playtime
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000094",
  "levels": [
    { "experience_level": "first_play", "median_minutes": 120, "min_minutes": 90, "max_minutes": 180, "total_reports": 456 },
    { "experience_level": "learning", "median_minutes": 90, "min_minutes": 65, "max_minutes": 130, "total_reports": 712 },
    { "experience_level": "experienced", "median_minutes": 70, "min_minutes": 50, "max_minutes": 100, "total_reports": 1534 },
    { "experience_level": "expert", "median_minutes": 55, "min_minutes": 40, "max_minutes": 80, "total_reports": 389 }
  ],
  "multipliers": { "first_play": 1.71, "learning": 1.29, "experienced": 1.0, "expert": 0.79 },
  "sufficient_data": true,
  "total_reports": 3091
}
```

### Analytical Questions Enabled

- **Which games have the steepest learning curve?** Sort by first_play multiplier descending -- games where the gap between first play and experienced play is largest.
- **Which games are "easy to learn"?** Low first_play multiplier means play time barely changes with experience.
- **Expert speedrun potential**: Which games have the lowest expert multiplier, suggesting the most room for optimization?
- **Data sufficiency**: Which games have enough experience-tagged play logs to produce reliable multipliers?

## Expansion Deltas as Analyzable Data

Property modifications and expansion combinations are not just internal data for effective mode -- they are exportable entities. See [Data Export](./export.md) for how to bulk-download this data.

Interesting analyses enabled by this data:

- **Average weight increase per expansion**: Do expansions tend to make games more complex?
- **Player count expansion patterns**: How often do expansions increase the max player count? By how much?
- **Playtime inflation**: Do expansions make games longer? By what percentage?
- **Best-at shift**: Does adding expansions change which player counts are considered best?

These questions are unanswerable without structured, exportable expansion delta data. OpenTabletop makes them trivial.
