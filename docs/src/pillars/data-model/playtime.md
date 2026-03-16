# Play Time Model

Play time is one of the most commonly misrepresented data points in board gaming. The publisher says "60 minutes," but your first game took 3 hours. The data model addresses this with a dual-source approach: publisher-stated times and community-reported times as separate, independent fields.

## Publisher-Stated Play Time

The `min_playtime` and `max_playtime` fields store what appears on the box, in minutes:

| Field | Type | Description |
|-------|------|-------------|
| `min_playtime` | integer | Publisher's minimum play time in minutes |
| `max_playtime` | integer | Publisher's maximum play time in minutes |

These are factual records of what the publisher claims. They are useful for comparison across games (a "60-90 minute" game is in a different category than a "180-240 minute" game), but they should not be taken as accurate predictions of actual play time.

### Why Publisher Times Are Optimistic

Publisher play time estimates are systematically biased toward lower numbers for several reasons:

- **Marketing pressure.** A shorter play time makes the game more appealing to a wider audience. "90 minutes" sounds more accessible than "2-3 hours."
- **Experienced players assumed.** Publishers often time with their own playtest groups who know the game intimately. First-time players will be significantly slower.
- **Setup and teardown excluded.** The timer starts when the first turn begins, not when you open the box. For complex games, setup can add 15-30 minutes.
- **Analysis paralysis not modeled.** Real players think longer than ideal players, especially in strategy-heavy games.
- **Player count variation ignored.** Many publishers list a single time range that does not scale with player count, even when a 5-player game takes twice as long as a 2-player game.

## Community-Reported Play Time

The `community_min_playtime` and `community_max_playtime` fields are derived from actual play logs submitted by community members:

| Field | Type | Description |
|-------|------|-------------|
| `community_min_playtime` | integer | Community-reported minimum play time in minutes |
| `community_max_playtime` | integer | Community-reported maximum play time in minutes |

These represent the range within which most community-reported plays fall. The specification defines "most" as the 10th to 90th percentile of reported play times, excluding obvious data entry errors (plays under 5 minutes or over 24 hours for non-campaign games).

### Data Source

Community play times come from logged plays where the player recorded a duration. Not all logged plays include duration, and the ones that do are self-reported, so there is inherent noise. With enough data points, the aggregate provides a more detailed picture than publisher estimates — though it still reflects the play patterns of people who log their games, who tend to be more experienced hobbyist gamers. See [Data Provenance & Bias](./data-provenance.md) for more on how community data is shaped by who contributes it.

### Example: Terraforming Mars

| Source | Min | Max |
|--------|-----|-----|
| Publisher | 120 min | 120 min |
| Community | 90 min | 180 min |

The publisher lists a single value: 120 minutes. The community data tells a much richer story: experienced 2-player games can finish in 90 minutes, while 5-player games with new players regularly exceed 3 hours. The 120-minute publisher estimate is not wrong — it is just the median for an experienced 3-player game, which is one narrow slice of the full picture.

### Example: Gloomhaven

| Source | Min | Max |
|--------|-----|-----|
| Publisher | 60 min | 120 min |
| Community | 90 min | 180 min |

The publisher's optimistic "60-120 minutes" per scenario misses that most groups, especially in early scenarios with new characters, spend 90-180 minutes. Setup and teardown alone can take 20 minutes.

## Filtering by Play Time

The [filter dimensions](../filtering/dimensions.md) support both sources:

- `playtime_min` / `playtime_max` — Filter using whichever source is selected by `playtime_source`
- `playtime_source=publisher` — Use publisher-stated times (default)
- `playtime_source=community` — Use community-reported times

Why default to publisher times? Because publisher times are available for nearly every game, while community times require sufficient play log data. For less popular games, community data may not exist. Defaulting to publisher ensures the broadest coverage while allowing users who want accuracy to opt into community times.

## Play Time with Expansions

Expansions frequently change play time. Adding content means more decisions, more setup, and longer games. The [property delta system](./property-deltas.md) captures these changes:

- Base game publisher time: 90-120 min
- With expansion: 90-150 min (individual delta)
- With two expansions: 120-180 min (explicit combination)

When [effective mode](../filtering/effective-mode.md) is enabled, play time filtering considers these expansion effects.

## Experience-Adjusted Play Time

All playtime data — publisher-stated, community-reported, and expansion-modified — implicitly assumes experienced players. But a first play of Spirit Island takes 57% longer than an experienced play. The experience-adjusted playtime model (ADR-0034) addresses this by bucketing community play data by experience level.

### Experience Levels

| Level | Description | Typical Multiplier |
|-------|-------------|-------------------|
| `first_play` | Everyone is new to the game | ~1.5× |
| `learning` | 1-3 prior plays, still referencing rules | ~1.25× |
| `experienced` | 4+ plays, knows the rules well (baseline) | 1.0× |
| `expert` | Optimized play, minimal downtime | ~0.85× |

### How It Works

Community play logs include a self-reported experience level. The system aggregates these into per-level median and percentile times. Multipliers are derived per-game as `median[level] / median[experienced]`.

### Example: Spirit Island

| Level | Median | 10th pctl | 90th pctl | Reports |
|-------|--------|-----------|-----------|---------|
| First play | 165 min | 120 min | 240 min | 342 |
| Learning | 135 min | 100 min | 180 min | 518 |
| Experienced | 105 min | 75 min | 150 min | 1,204 |
| Expert | 80 min | 60 min | 110 min | 287 |

Spirit Island's first-play multiplier is 1.57× — a first-time group should budget nearly twice as long as the box suggests. The expert multiplier of 0.76× reflects that veteran players who have internalized the decision trees can finish significantly faster.

### Why Per-Game Multipliers Matter

Different games have fundamentally different experience curves:

- **Party games** (Codenames, Wavelength): Near-zero first-play penalty. Rules take 2 minutes to explain, and play speed barely changes with experience.
- **Medium-weight euros** (Wingspan, Everdell): Moderate first-play penalty (~1.3×). The rules are learnable in one session, but card familiarity speeds up experienced play.
- **Heavy games** (Spirit Island, Through the Ages): High first-play penalty (~1.5-2.0×). Complex interlocking systems, large decision trees, and frequent rules references extend first plays dramatically.

A global multiplier would be wrong for all three categories. Game-specific data from community play logs captures these differences accurately.

### Filtering by Experience Level

The `playtime_experience` parameter adjusts playtime filtering:

```
GET /games?playtime_max=120&playtime_source=community&playtime_experience=first_play
```

This asks: "Show me games where a first play fits in 2 hours." Spirit Island's community max (150 min) adjusted for first_play (× 1.57 = 235 min) exceeds 120, so it is correctly excluded — a first play of Spirit Island will not fit in 2 hours.

See [Filter Dimensions](../filtering/dimensions.md) for the full parameter reference.

### Games Without Experience Data

Games with fewer than a minimum number of experience-tagged play logs fall back to global default multipliers (derived from aggregate data across all games). The `sufficient_data` flag in the experience profile indicates whether game-specific or global multipliers are in use.

## Future: Play Time Distribution

The current model stores the range (min/max). A future version of the specification may include full distribution data:

- Median play time
- Percentile breakdown (25th, 50th, 75th, 90th)
- Play time by player count (2p median, 3p median, etc.)
- Play time trend over time (are plays getting faster as the community learns the game?)

This data exists in play logs and is planned for the [statistics foundation](../statistics/overview.md). The current range fields are a pragmatic starting point.
