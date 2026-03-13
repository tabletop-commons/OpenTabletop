# Data Structures

The statistical foundation is built on specific data structures that capture community opinion as raw distributions rather than pre-computed summaries.

## PlayerCountPoll

The player count poll is the most important statistical data structure in the specification. For each game and each supported player count, it records the full vote distribution.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `player_count` | integer | The specific player count (1, 2, 3, ...) |
| `best_votes` | integer | Number of "Best" votes |
| `recommended_votes` | integer | Number of "Recommended" votes |
| `not_recommended_votes` | integer | Number of "Not Recommended" votes |
| `total_votes` | integer | Sum of all three vote types |

### Example: Wingspan

| Player Count | Best | Recommended | Not Recommended | Total |
|-------------|------|-------------|-----------------|-------|
| 1 | 189 | 812 | 321 | 1322 |
| 2 | 654 | 703 | 78 | 1435 |
| 3 | 1021 | 489 | 42 | 1552 |
| 4 | 387 | 601 | 298 | 1286 |
| 5 | 52 | 178 | 834 | 1064 |

From this raw data, a consumer can derive:

- **Best at 3**: Player count 3 has the highest Best vote ratio (65.8%).
- **Sweet spot is 2-3**: Both have strong Best+Recommended ratios.
- **5 is polarizing**: The game technically supports 5, but 78.4% say Not Recommended.
- **Solo is decent but not ideal**: 62% recommend or consider it best, but 24% say Not Recommended.

Different applications might draw the line differently. A family-focused app might use "Recommended" as sufficient; a competitive gaming app might only show "Best" counts. The raw data supports both interpretations.

### Accessing Poll Data

```http
GET /games/wingspan/player-count-poll
```

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000060",
  "polls": [
    { "player_count": 1, "best_votes": 189, "recommended_votes": 812, "not_recommended_votes": 321, "total_votes": 1322 },
    { "player_count": 2, "best_votes": 654, "recommended_votes": 703, "not_recommended_votes": 78, "total_votes": 1435 },
    { "player_count": 3, "best_votes": 1021, "recommended_votes": 489, "not_recommended_votes": 42, "total_votes": 1552 },
    { "player_count": 4, "best_votes": 387, "recommended_votes": 601, "not_recommended_votes": 298, "total_votes": 1286 },
    { "player_count": 5, "best_votes": 52, "recommended_votes": 178, "not_recommended_votes": 834, "total_votes": 1064 }
  ]
}
```

## Weight Votes

The `weight` field on a Game is an average. The weight vote distribution provides the underlying data.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `votes` | object | Map of weight value (string) to vote count |
| `total_votes` | integer | Sum of all votes |
| `average` | float | Computed average (same as Game.weight) |

### Example: Spirit Island

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000001",
  "votes": {
    "1.0": 12,
    "1.5": 8,
    "2.0": 45,
    "2.5": 112,
    "3.0": 389,
    "3.5": 1245,
    "4.0": 1876,
    "4.5": 1102,
    "5.0": 338
  },
  "total_votes": 5127,
  "average": 3.89
}
```

This distribution tells a richer story than the average alone. Spirit Island's weight is concentrated in the 3.5-4.5 range, confirming community consensus that it is a heavy game. The small number of 1.0-2.0 votes are likely people who misunderstood the scale or are expressing a different opinion about accessibility.

A bimodal distribution (many 2.0 votes and many 4.0 votes) would suggest the game's complexity is debated, which is useful information that an average hides.

### Accessing Weight Distribution

```http
GET /games/spirit-island/weight-votes
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

### Example: Terraforming Mars

```json
{
  "game_id": "01967b3c-5a00-7000-8000-000000000070",
  "total_plays": 8423,
  "min_reported": 45,
  "max_reported": 360,
  "median": 135,
  "p10": 80,
  "p25": 105,
  "p75": 165,
  "p90": 210,
  "by_player_count": {
    "1": { "median": 75, "plays": 1204 },
    "2": { "median": 105, "plays": 3812 },
    "3": { "median": 145, "plays": 2156 },
    "4": { "median": 180, "plays": 1089 },
    "5": { "median": 220, "plays": 162 }
  }
}
```

This data reveals what the publisher's "120 minutes" hides:
- The median is actually 135 minutes, not 120.
- 2-player games run about 105 minutes (close to the publisher estimate).
- 4-player games take 180 minutes — 50% longer than the box says.
- The 90th percentile is 210 minutes — some groups are spending 3.5 hours.
- The per-player-count breakdown shows the scaling factor clearly.

### Accessing Play Time Data

```http
GET /games/terraforming-mars/community-playtime
```

## Experience Playtime Poll

The experience playtime poll captures community-reported play times bucketed by player experience level. Like PlayerCountPoll, it stores raw distributions rather than pre-computed summaries. See ADR-0034.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being evaluated |
| `experience_level` | string | `first_play`, `learning`, `experienced`, or `expert` |
| `median_minutes` | integer | Median reported play time for this level |
| `min_minutes` | integer | 10th percentile play time |
| `max_minutes` | integer | 90th percentile play time |
| `total_reports` | integer | Number of contributing play reports |

### Example: Spirit Island

| Level | Median | p10 | p90 | Reports |
|-------|--------|-----|-----|---------|
| first_play | 165 min | 120 min | 240 min | 342 |
| learning | 135 min | 100 min | 180 min | 518 |
| experienced | 105 min | 75 min | 150 min | 1,204 |
| expert | 80 min | 60 min | 110 min | 287 |

From this data, multipliers are derived: first_play = 165/105 = 1.57, expert = 80/105 = 0.76. This tells consumers that a first play of Spirit Island takes 57% longer than an experienced play — critical information for game night planning.

### Accessing Experience Playtime Data

```http
GET /games/spirit-island/experience-playtime
```

```json
{
  "game_id": "01912f4c-7e3a-7b1a-8c5d-9f0e1a2b3c4d",
  "levels": [
    { "experience_level": "first_play", "median_minutes": 165, "min_minutes": 120, "max_minutes": 240, "total_reports": 342 },
    { "experience_level": "learning", "median_minutes": 135, "min_minutes": 100, "max_minutes": 180, "total_reports": 518 },
    { "experience_level": "experienced", "median_minutes": 105, "min_minutes": 75, "max_minutes": 150, "total_reports": 1204 },
    { "experience_level": "expert", "median_minutes": 80, "min_minutes": 60, "max_minutes": 110, "total_reports": 287 }
  ],
  "multipliers": { "first_play": 1.57, "learning": 1.29, "experienced": 1.0, "expert": 0.76 },
  "sufficient_data": true,
  "total_reports": 2351
}
```

### Analytical Questions Enabled

- **Which games have the steepest learning curve?** Sort by first_play multiplier descending — games where the gap between first play and experienced play is largest.
- **Which games are "easy to learn"?** Low first_play multiplier means play time barely changes with experience.
- **Expert speedrun potential**: Which games have the lowest expert multiplier, suggesting the most room for optimization?
- **Data sufficiency**: Which games have enough experience-tagged play logs to produce reliable multipliers?

## Expansion Deltas as Analyzable Data

Property modifications and expansion combinations are not just internal data for effective mode — they are exportable entities. See [Data Export](./export.md) for how to bulk-download this data.

Interesting analyses enabled by this data:

- **Average weight increase per expansion**: Do expansions tend to make games more complex?
- **Player count expansion patterns**: How often do expansions increase the max player count? By how much?
- **Playtime inflation**: Do expansions make games longer? By what percentage?
- **Best-at shift**: Does adding expansions change which player counts are considered best?

These questions are unanswerable without structured, exportable expansion delta data. OpenTabletop makes them trivial.
