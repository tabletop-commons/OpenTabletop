# Filter Dimensions

The filtering system is organized into six orthogonal dimensions. Each dimension addresses a distinct aspect of the query, and they combine using the composition rules described in [Dimension Composition](./composition.md).

## Dimension 1: Player Count

Filter games by how many people can play them.

| Parameter | Type | Description |
|-----------|------|-------------|
| `players` | integer | Exact player count. Matches games where `min_players <= players <= max_players`. |
| `players_min` | integer | Minimum player count. Games must support at least this many players. |
| `players_max` | integer | Maximum player count. Games must support no more than this many players. |
| `best_at` | integer | Community "best" player count. Matches games where this count has the highest "Best" vote ratio in the player count poll. |
| `recommended_at` | integer | Community "recommended" player count. Matches games where Best + Recommended votes exceed Not Recommended for this count. |
| `effective` | boolean | When `true`, also searches across expansion combinations. See [Effective Mode](./effective-mode.md). |

**Notes:**
- `players=4` means "supports exactly 4 players" — the game's range includes 4.
- `best_at=4` means "the community considers 4 the best player count." This is a much smaller set than `players=4`.
- `recommended_at=4` is broader than `best_at=4` — it includes games where 4 is good but not necessarily ideal.
- `players_min` and `players_max` filter on the game's range, not on a specific count. `players_min=3&players_max=5` means "games that support at least 3 and at most 5 players" — so a 2-6 player game matches but a 2-4 player game does not (its max is below 5... actually it does match because max_players=4 is <= 5). To clarify: `players_min=3` means the game's `min_players >= 3`, and `players_max=5` means the game's `max_players <= 5`.

**Wait — let me correct that.** The semantics need to be precise:

| Parameter | Condition | Meaning |
|-----------|-----------|---------|
| `players` | `min_players <= players <= max_players` | The game supports this exact count |
| `players_min` | `min_players >= players_min` | The game requires at least this many players to start |
| `players_max` | `max_players <= players_max` | The game caps at this many players |
| `best_at` | Poll data: best ratio exceeds threshold for this count | Community considers this count ideal |
| `recommended_at` | Poll data: recommended ratio exceeds threshold for this count | Community considers this count good |

So `players_min=3` returns games that *require* 3+ players (excludes solo and 2-player games). `players_max=4` returns games that *cap at* 4 or fewer (excludes 5+ player games).

## Dimension 2: Play Time

Filter games by how long they take to play.

| Parameter | Type | Description |
|-----------|------|-------------|
| `playtime_min` | integer | Minimum play time in minutes. Games must take at least this long. |
| `playtime_max` | integer | Maximum play time in minutes. Games must finish within this time. |
| `community_playtime_min` | integer | Like `playtime_min` but uses community-reported times. |
| `community_playtime_max` | integer | Like `playtime_max` but uses community-reported times. |
| `playtime_source` | string | Which time source to use when `playtime_min`/`playtime_max` are specified: `"publisher"` (default) or `"community"`. |
| `playtime_experience` | string | Experience level adjustment: `"first_play"`, `"learning"`, `"experienced"`, or `"expert"`. Adjusts game playtime values by the experience multiplier before comparison. See [Play Time Model](../data-model/playtime.md#experience-adjusted-play-time) and ADR-0034. |

**Notes:**
- `playtime_max=90` with `playtime_source=publisher` matches games where the publisher's `max_playtime <= 90`.
- `playtime_max=90` with `playtime_source=community` matches games where `community_max_playtime <= 90`.
- You can use `community_playtime_max` directly instead of the `playtime_source` toggle for explicit control.
- When `effective=true`, play time considers expansion combinations. See [Effective Mode](./effective-mode.md).
- `playtime_experience=first_play` adjusts game times upward before comparison. A game with community max 90 min and a 1.5× first-play multiplier is treated as 135 min for filtering. This composes with `playtime_source` and `effective=true`: source is selected first, then expansion resolution, then experience adjustment, then comparison.

## Dimension 3: Weight (Complexity)

Filter games by their community-voted complexity score.

| Parameter | Type | Description |
|-----------|------|-------------|
| `weight_min` | float | Minimum weight (1.0 - 5.0 scale). |
| `weight_max` | float | Maximum weight (1.0 - 5.0 scale). |
| `effective_weight` | boolean | When `true` and `effective=true`, uses expansion-modified weight values. |

**Notes:**
- `weight_min=2.0&weight_max=3.5` selects "medium weight" games — substantial decisions without being overwhelming.
- Weight is a community-voted value on a 1.0-5.0 scale. See [Game Entity](../data-model/games.md) for the scale interpretation.
- Games with fewer than a configurable threshold of weight votes (default: 30) can be excluded with `min_weight_votes=30`.

## Dimension 4: Game Type & Mechanics

Filter by the game's type discriminator and its mechanical classification.

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string or string[] | Game type(s): `base_game`, `expansion`, `standalone_expansion`, `promo`, `accessory`, `fan_expansion`. Default: `["base_game", "standalone_expansion"]`. |
| `mode` | string | Shorthand for common type combinations: `"all"`, `"playable"` (base + standalone), `"addons"` (expansion + promo + accessory). |
| `mechanics` | string[] | Games must have ANY of these mechanics (OR logic). |
| `mechanics_all` | string[] | Games must have ALL of these mechanics (AND logic). |
| `mechanics_not` | string[] | Games must have NONE of these mechanics (exclusion). |

**Notes:**
- `type` defaults to `["base_game", "standalone_expansion"]` because most queries want playable games, not individual expansions or promos.
- `mechanics=["cooperative", "deck-building"]` matches games with cooperative OR deck-building (or both).
- `mechanics_all=["cooperative", "hand-management"]` matches games with BOTH cooperative AND hand-management.
- `mechanics_not=["player-elimination"]` excludes games with player elimination.
- These three mechanic parameters can be combined: `mechanics_all=["cooperative"]&mechanics_not=["dice-rolling"]` finds cooperative games that do not use dice.

## Dimension 5: Theme

Filter by thematic setting.

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | string[] | Games must have ANY of these themes (OR logic). |
| `theme_not` | string[] | Games must have NONE of these themes (exclusion). |

**Notes:**
- `theme=["fantasy", "mythology"]` matches games themed around fantasy OR mythology.
- `theme_not=["space"]` excludes all space-themed games.
- Theme inclusion and exclusion can be combined: `theme=["historical"]&theme_not=["war"]` finds historical games that are not war-themed.

## Dimension 6: Metadata

Filter by publication metadata, creators, and classification.

| Parameter | Type | Description |
|-----------|------|-------------|
| `designer` | string[] | Games designed by ANY of these people (by slug or ID). |
| `publisher` | string[] | Games published by ANY of these organizations (by slug or ID). |
| `family` | string[] | Games in ANY of these families (by slug or ID). |
| `category` | string[] | Games in ANY of these categories (by slug). |
| `year_min` | integer | Published in or after this year. |
| `year_max` | integer | Published in or before this year. |
| `rating_min` | float | Minimum community rating (1.0 - 10.0). |
| `min_rating_votes` | integer | Minimum number of rating votes (excludes obscure games). |
| `min_weight_votes` | integer | Minimum number of weight votes. |

**Notes:**
- `designer=["r-eric-reuss"]` finds all games by R. Eric Reuss.
- `year_min=2020&year_max=2025` finds games published in the 2020s.
- `rating_min=7.0&min_rating_votes=1000` finds well-rated games with enough votes to be statistically meaningful.
- `family=["pandemic"]` finds all games in the Pandemic family, regardless of type.

## Sorting

Results can be sorted by:

| Sort Value | Description |
|------------|-------------|
| `rating_desc` | Highest rated first |
| `rating_asc` | Lowest rated first |
| `weight_desc` | Heaviest first |
| `weight_asc` | Lightest first |
| `year_desc` | Newest first |
| `year_asc` | Oldest first |
| `name_asc` | Alphabetical A-Z |
| `name_desc` | Alphabetical Z-A |
| `playtime_asc` | Shortest play time first |
| `playtime_desc` | Longest play time first |

Default sort is `rating_desc`.

## Pagination

All filtered results are paginated using keyset cursors. See [Pagination](../../specification/pagination.md).

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum results per page (default: 20, max: 100). |
| `cursor` | string | Opaque cursor from a previous response for the next page. |
