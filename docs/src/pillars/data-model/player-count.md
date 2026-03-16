# Player Count Model

Player count is not a single number. A game that "supports 1-4 players" may be excellent at 2, good at 3, mediocre at 1, and actively bad at 4. The player count model captures this nuance through three layers: publisher range, community polling, and effective range with expansions.

## Publisher Range

The `min_players` and `max_players` fields on the [Game entity](./games.md) store what the publisher prints on the box. These are factual — the publisher says the game supports this range — but they say nothing about quality.

**Example:** *Spirit Island* is listed as 1-4 players. This is accurate in the sense that the rules work for 1, 2, 3, or 4. It tells you nothing about whether 4-player Spirit Island is actually a good experience (it is, but it takes a long time).

## Community Player Count Polls

The `PlayerCountPoll` entity captures community votes on the quality of each supported player count:

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being rated |
| `player_count` | integer | The specific player count being evaluated |
| `best_votes` | integer | Number of "Best" votes |
| `recommended_votes` | integer | Number of "Recommended" votes |
| `not_recommended_votes` | integer | Number of "Not Recommended" votes |
| `total_votes` | integer | Sum of all votes for this player count |

For each player count in the supported range (and sometimes beyond), community members vote one of three options:

- **Best** — This is the ideal player count for this game.
- **Recommended** — This player count works well.
- **Not Recommended** — This player count is a poor experience.

### Example: Spirit Island Poll Data

| Player Count | Best | Recommended | Not Recommended | Total |
|-------------|------|-------------|-----------------|-------|
| 1 | 312 | 589 | 142 | 1043 |
| 2 | 876 | 421 | 28 | 1325 |
| 3 | 298 | 612 | 187 | 1097 |
| 4 | 145 | 402 | 489 | 1036 |

From this data, a consumer can derive:

- **Best at 2**: Player count 2 has the most "Best" votes and the highest best-to-total ratio (66%).
- **Recommended at 1, 2, 3**: These player counts have more Best+Recommended than Not Recommended.
- **Not recommended at 4**: Player count 4 has the highest Not Recommended ratio (47%), though opinions are split.

The specification stores the *raw votes*, not the derived conclusions. Different applications may use different thresholds for "recommended" vs "not recommended." The raw data enables any analysis.

Player count poll data reflects the voting community's experience and preferences. This community tends to be experienced hobbyist gamers whose priorities at different player counts — tolerance for downtime, game length, and complexity scaling — may differ from casual players, families, or groups new to the hobby. The raw vote data enables consumers to apply their own interpretive thresholds appropriate to their audience. See [Data Provenance & Bias](./data-provenance.md).

## Derived Fields

For convenience, the Game entity includes pre-computed derived fields based on the poll data:

| Field | Type | Description |
|-------|------|-------------|
| `best_player_counts` | integer[] | Player counts where Best votes exceed a threshold |
| `recommended_player_counts` | integer[] | Player counts where Best + Recommended exceed Not Recommended |

These are computed by the server using a standard algorithm (Best votes > 50% of total for `best_player_counts`; Best + Recommended > Not Recommended for `recommended_player_counts`). They are convenience fields — the raw poll data is always available for custom analysis.

## "Best at 2" vs "Supports 2"

This distinction is critical and is something no existing board game API captures well:

- **"Supports 2"** means the rules work with 2 players. This is a binary fact derived from `min_players <= 2 <= max_players`.
- **"Best at 2"** means the community considers 2 the ideal player count. This is an opinion derived from poll data.
- **"Recommended at 2"** means the community considers 2 a good (if not ideal) player count. This is a softer threshold.

All three are independently filterable. When you search for games with `players=4`, you get games that *support* 4. When you search with `best_at=4`, you get games that the community considers *best* at 4. When you search with `recommended_at=4`, you get games where 4 is at least a good experience.

## Effective Player Count with Expansions

When [effective mode](../filtering/effective-mode.md) is enabled, player count filtering considers expansion combinations. The `ExpansionCombination` entity can override player count ranges and poll-derived recommendations:

- Spirit Island base: supports 1-4, best at 2
- Spirit Island + Jagged Earth: supports 1-6, best at 2-3
- Spirit Island + Branch & Claw + Jagged Earth: supports 1-6, best at 2-4

Effective mode searches across all known combinations, so a query for `best_at=4&effective=true` would surface the Spirit Island + B&C + JE combination even though the base game is not best at 4.

See [Property Deltas & Combinations](./property-deltas.md) for how these effective properties are determined.

## Beyond the Range

Community polls sometimes include votes for player counts outside the publisher range. A game listed as 2-4 players might have poll data for 1 player (via an unofficial solo variant) or 5 players (via a fan expansion or house rule). These votes are stored if they exist but are clearly outside the publisher-stated range, and the API distinguishes them accordingly.
