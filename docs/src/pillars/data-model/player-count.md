# Player Count Model

Player count is not a single number. A game that "supports 1-4 players" may be excellent at 2, good at 3, mediocre at 1, and actively bad at 4. The player count model captures this nuance through three layers: publisher range, community ratings per count, and effective range with expansions.

## Publisher Range

The `min_players` and `max_players` fields on the [Game entity](./games.md) store what the publisher prints on the box. These are factual -- the publisher says the game supports this range -- but they say nothing about quality.

**Example:** *Terraforming Mars* is listed as 1-5 players. This is accurate in the sense that the rules work for any count in that range -- but it says nothing about quality. The solo mode is essentially a different game (beating a timer rather than competing), and 5-player games can run over three hours.

## Community Player Count Ratings

The `PlayerCountRating` entity captures how the community rates the experience at each supported player count. Each voter independently rates each player count on a **1-5 scale** (1 = poor, 5 = excellent). This produces a real numeric distribution per player count that can be analyzed with standard statistical tools.

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being rated |
| `player_count` | integer | The specific player count being evaluated |
| `average_rating` | float (1.0-5.0) | Mean community rating at this player count |
| `rating_count` | integer | Number of votes at this player count |
| `rating_stddev` | float | Standard deviation (consensus vs polarization) |

Key properties of this model:

- **Independent ratings.** A voter who thinks 3p and 4p are both excellent can rate both 5/5. No forced ranking.
- **No overlapping categories.** A single numeric scale has no ambiguity about where "good" ends and "great" begins -- those are thresholds consumers choose.
- **Standard statistics.** Mean, median, std dev, percentiles, confidence intervals -- all standard tools apply directly.
- **Per-count distributions.** Implementations are encouraged to store the full vote distribution (how many 1s, 2s, 3s, 4s, 5s) per player count, not just the average.

### Example: *Terraforming Mars* Player Count Ratings

| Player Count | Avg Rating | Votes | Std Dev | Signal |
|-------------|-----------|-------|---------|--------|
| 1 | 2.1 / 5 | 1,277 | 1.2 | Polarizing -- solo mode divisive |
| 2 | 4.2 / 5 | 1,222 | 0.7 | Strong consensus -- great at 2 |
| 3 | 4.7 / 5 | 1,407 | 0.5 | Tight consensus -- widely considered the sweet spot |
| 4 | 3.6 / 5 | 1,246 | 1.0 | Good but opinions vary |
| 5 | 2.3 / 5 | 1,141 | 1.1 | Polarizing -- game length is the concern |

From this data, a consumer can derive:

- **Highest rated at 3** (4.7/5 with tight consensus at std dev 0.5).
- **Well-rated at 2 and 4** (both above 3.5, the "good" threshold).
- **Poorly rated at 1 and 5** (both below 2.5, suggesting these counts are not the intended experience).
- **Polarization visible** at 1p and 5p via high standard deviation -- voters disagree, some love the solo mode while others don't consider it a real game.

The specification stores the *raw rating data*, not derived labels. Different applications may use different thresholds: a hardcore strategy app might set "recommended" at 4.0+, while a family app might set it at 3.0+. The raw data enables any interpretation.

Player count rating data reflects the voting community's experience and preferences. This community tends to be experienced hobbyist gamers whose priorities at different player counts -- tolerance for downtime, game length, and complexity scaling -- may differ from casual players, families, or groups new to the hobby. See [Data Provenance & Bias](./data-provenance.md).

## BGG Legacy Data

For migration from BoardGameGeek ([ADR-0032](../../adr/0032-strangler-fig-legacy-migration.md)), the specification also supports the `PlayerCountPollLegacy` schema, which preserves BGG's three-tier voting model (Best / Recommended / Not Recommended). This data is imported during migration and available via the API, but it is not the native model.

The three-tier model has known statistical limitations -- overlapping categories, forced ranking, missing middle ground, and anchoring bias -- documented in [ADR-0043](../../adr/0043-player-count-sentiment-model-improvements.md). Implementations may convert legacy three-tier data to approximate numeric ratings (e.g., Best -> 5, Recommended -> 3.5, Not Recommended -> 1.5) for unified querying, but should flag the source as `"bgg_converted"` for transparency.

## Derived Fields

For convenience, the Game entity includes pre-computed derived fields based on the rating data:

| Field | Type | Description |
|-------|------|-------------|
| `top_player_counts` | integer[] | Player counts with average rating above a high threshold (e.g., 4.0+) |
| `recommended_player_counts` | integer[] | Player counts with average rating above a moderate threshold (e.g., 3.0+) |

These thresholds are implementation-defined. The specification documents them as convenience fields -- the raw per-count rating data is always available for custom analysis.

## "Highly Rated at 2" vs "Supports 2"

This distinction -- between *factual support* and *community quality sentiment* -- is critical and is something no existing board game API captures well:

- **"Supports 2"** means the rules work with 2 players. This is a binary fact derived from `min_players <= 2 <= max_players`.
- **"Highly rated at 2"** means the community rates the 2-player experience well (e.g., above 4.0/5). This is a community assessment derived from per-count ratings.
- **"Acceptable at 2"** means the community considers 2 at least a reasonable experience (e.g., above 3.0/5). This is a softer threshold.

All three are independently filterable. When you search for games with `players=4`, you get games that *support* 4. When you search with `top_at=4`, you get games the community rates highly at 4. When you search with `recommended_at=4`, you get games where 4 is at least a decent experience. The specific threshold values are application-defined -- the API provides the raw per-count ratings and lets consumers set their own cutoffs.

## Effective Player Count with Expansions

When [effective mode](../filtering/effective-mode.md) is enabled, player count filtering considers expansion combinations. The `ExpansionCombination` entity can override player count ranges and community ratings:

- *Cosmic Encounter* base: supports 3-5, highest rated at 5 (4.6/5)
- *Cosmic Encounter* + *Cosmic Incursion*: supports 3-6, highest rated at 5-6 (4.5+/5)
- *Cosmic Encounter* + *Cosmic Incursion* + *Cosmic Conflict*: supports 3-7, highest rated at 5-6 (4.4+/5)
- *Cosmic Encounter* + all expansions: supports 3-8, highest rated at 5-6 (4.3+/5)

Effective mode searches across all known combinations, so a query for `players=7&effective=true` would surface the *Cosmic Encounter* + *Incursion* + *Conflict* combination even though the base game only supports up to 5.

See [Property Deltas & Combinations](./property-deltas.md) for how these effective properties are determined.

## Beyond the Range

Community ratings sometimes include data for player counts outside the publisher range. A game listed as 2-4 players might have ratings for 1 player (via an unofficial solo variant) or 5 players (via a fan expansion or house rule). These ratings are stored if they exist but are clearly outside the publisher-stated range, and the API distinguishes them accordingly.

## OpenTabletop's Approach

### Input Contract

The player count model follows the specification's [Input Contract](./data-provenance.md#input-contract) principles:

| Element | Player Count-Specific Definition |
|---------|--------------------------------|
| **Question** | "Rate your experience playing *[Game]* at *[N]* players" (asked independently per count) |
| **Scale** | 1-5 (1 = poor experience at this count, 3 = acceptable, 5 = excellent) |
| **Context captured** | Number of plays at this specific player count, overall familiarity with the game |
| **Transparency** | "Each player count is rated independently. You can rate multiple counts equally -- no forced ranking." |

## Known Limitations

The numeric per-count rating model addresses the major flaws of BGG's three-tier system (see [ADR-0043](../../adr/0043-player-count-sentiment-model-improvements.md)), but has its own considerations:

- **Scale calibration.** What does "3 out of 5" mean for a player count? The specification does not yet define anchor descriptions (unlike the weight scale). This is a future RFC topic.
- **BGG data conversion.** Converting three-tier BGG data to numeric ratings requires mapping assumptions (e.g., Best -> 5, Recommended -> 3.5, NR -> 1.5). Different mappings produce different results. Implementations should document their conversion formula.
- **Voter adoption.** The numeric model requires voters to learn a new interface. Implementations that also support the familiar BGG-style three-tier input as an alternative should convert those inputs to numeric values internally.
- **Population bias.** Regardless of the voting model, the voter population skews toward experienced hobbyist gamers. The rating data reflects their priorities (tolerance for downtime, strategic depth at each count), not a universal assessment. See [Data Provenance & Bias](./data-provenance.md).
