# Filter Dimensions

The filtering system is organized into nine dimensions, ordered to match the [Pillar 1 data model](../data-model/overview.md) sequence. Each dimension addresses a distinct aspect of the query, and they combine using the composition rules described in [Dimension Composition](./composition.md).

## Dimension 1: Rating & Confidence

Filter games by community rating quality and reliability.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rating_min` | float | Minimum community rating (1.0 - 10.0). |
| `rating_max` | float | Maximum community rating (1.0 - 10.0). |
| `min_rating_votes` | integer | Minimum number of rating votes (excludes obscure games). |
| `confidence_min` | float | Minimum rating confidence score (0.0 - 1.0). See [Rating Model](../data-model/rating-model.md#layer-3-confidence-score). |

**Notes:**
- `rating_min=7.0&min_rating_votes=1000` finds well-rated games with enough votes to be statistically meaningful.
- `confidence_min=0.7` filters out games with unreliable ratings (brigaded, too few votes, or highly polarized). See the [pre-release brigading case study](../data-model/rating-model.md#case-study-pre-release-brigading) for why this matters.
- Confidence captures what vote count alone cannot: a game with 500 votes and std dev 4.0 has low confidence despite a reasonable sample size.

## Dimension 2: Weight (Complexity)

Filter games by their community-voted complexity score.

| Parameter | Type | Description |
|-----------|------|-------------|
| `weight_min` | float | Minimum composite weight (1.0 - 5.0 scale). |
| `weight_max` | float | Maximum composite weight (1.0 - 5.0 scale). |
| `effective_weight` | boolean | When `true` and `effective=true`, uses expansion-modified weight values. |
| `min_weight_votes` | integer | Minimum number of weight votes (excludes games with unreliable weight data). |

**Notes:**
- `weight_min=2.0&weight_max=3.5` selects "medium weight" games -- substantial decisions without being overwhelming.
- Weight is a community-voted value on a 1.0-5.0 scale. See [Weight Model](../data-model/weight-model.md) for the scale interpretation and known limitations.
- Games with fewer than a configurable threshold of weight votes (default: 30) can be excluded with `min_weight_votes=30`.

### Dimensional Weight Filters (Implementation-Dependent)

Implementations that support the [detailed weight mode](../data-model/weight-model.md#detailed-mode-dimensional-survey) may expose per-dimension filters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `weight_rules_complexity_min` | float | Minimum rules complexity (1-5). |
| `weight_rules_complexity_max` | float | Maximum rules complexity (1-5). |
| `weight_strategic_depth_min` | float | Minimum strategic depth (1-5). |
| `weight_strategic_depth_max` | float | Maximum strategic depth (1-5). |
| `weight_decision_density_min` | float | Minimum decision density (1-5). |
| `weight_decision_density_max` | float | Maximum decision density (1-5). |
| `weight_cognitive_load_min` | float | Minimum cognitive load (1-5). |
| `weight_cognitive_load_max` | float | Maximum cognitive load (1-5). |
| `weight_fiddliness_min` | float | Minimum fiddliness (1-5). |
| `weight_fiddliness_max` | float | Maximum fiddliness (1-5). |

These enable queries like "high strategic depth but low fiddliness" -- separating good complexity from tedious bookkeeping. These parameters are **optional** -- only available if the implementation collects dimensional weight data.

## Dimension 3: Player Count

Filter games by how many people can play them.

| Parameter | Type | Description |
|-----------|------|-------------|
| `players` | integer | Exact player count. Matches games where `min_players <= players <= max_players`. |
| `players_min` | integer | Minimum player count. The game's `min_players` must be >= this value. |
| `players_max` | integer | Maximum player count. The game's `max_players` must be <= this value. |
| `top_at` | integer | Community highly-rated player count. Matches games where the per-count average rating exceeds a high threshold (e.g., 4.0+/5) for this count. See [Player Count Model](../data-model/player-count.md). |
| `recommended_at` | integer | Community acceptable player count. Matches games where the per-count average rating exceeds a moderate threshold (e.g., 3.0+/5) for this count. |
| `effective` | boolean | When `true`, also searches across expansion combinations. See [Effective Mode](./effective-mode.md). |
| `include_integrations` | boolean | When `true` (and `effective=true`), also searches combinations involving `integrates_with` products. Default: `false`. See [Effective Mode: Integration modifier](./effective-mode.md#integration-modifier). |

**Semantics:**

| Parameter | Condition | Meaning |
|-----------|-----------|---------|
| `players` | `min_players <= players <= max_players` | The game supports this exact count |
| `players_min` | `min_players >= players_min` | The game requires at least this many players to start |
| `players_max` | `max_players <= players_max` | The game caps at this many players |
| `top_at` | Per-count average rating >= high threshold | Community rates this count highly |
| `recommended_at` | Per-count average rating >= moderate threshold | Community considers this count acceptable |

**Notes:**
- `players=4` means "supports exactly 4 players" -- the game's range includes 4.
- `top_at=4` means "the community rates the 4-player experience highly." This is a much smaller set than `players=4`. The threshold is implementation-defined (e.g., 4.0+/5).
- `recommended_at=4` is broader than `top_at=4` -- it includes games where 4 is acceptable but not necessarily the sweet spot. The threshold is implementation-defined (e.g., 3.0+/5).
- `players_min=3` returns games that *require* 3+ players (excludes solo and 2-player games). `players_max=4` returns games that *cap at* 4 or fewer (excludes 5+ player games).
- Per-count ratings use the numeric model from [ADR-0043](../../adr/0043-player-count-sentiment-model-improvements.md). Legacy BGG three-tier data (Best/Recommended/Not Recommended) is converted to numeric ratings for filtering. See [Player Count Model](../data-model/player-count.md#bgg-legacy-data).

## Dimension 4: Play Time

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
- `playtime_experience=first_play` adjusts game times upward before comparison. A game with community max 90 min and a 1.5x first-play multiplier is treated as 135 min for filtering. This composes with `playtime_source` and `effective=true`: source is selected first, then expansion resolution, then experience adjustment, then comparison.

## Dimension 5: Age Recommendation

Filter games by age appropriateness.

| Parameter | Type | Description |
|-----------|------|-------------|
| `age_min` | integer | Minimum age. Uses whichever source is selected by `age_source`. |
| `age_max` | integer | Maximum age. Uses whichever source is selected by `age_source`. |
| `community_age_min` | integer | Like `age_min` but explicitly uses community-suggested age. |
| `community_age_max` | integer | Like `age_max` but explicitly uses community-suggested age. |
| `age_source` | string | Which age source to use when `age_min`/`age_max` are specified: `"publisher"` (default, uses `min_age`) or `"community"` (uses `community_suggested_age`). |

**Notes:**
- `age_max=10` with `age_source=publisher` matches games where the publisher's `min_age <= 10`.
- `age_max=10` with `age_source=community` matches games where `community_suggested_age <= 10`.
- You can use `community_age_max` directly instead of the `age_source` toggle for explicit control.
- Publisher age recommendations tend to be conservative (see [Age Recommendation Model](../data-model/age-recommendation.md)). Community age data provides an alternative perspective based on actual play experience.

## Dimension 6: Game Type & Mechanics

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

## Dimension 7: Theme

Filter by thematic setting.

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | string[] | Games must have ANY of these themes (OR logic). |
| `theme_not` | string[] | Games must have NONE of these themes (exclusion). |

**Notes:**
- `theme=["fantasy", "mythology"]` matches games themed around fantasy OR mythology.
- `theme_not=["space"]` excludes all space-themed games.
- Theme inclusion and exclusion can be combined: `theme=["historical"]&theme_not=["war"]` finds historical games that are not war-themed.

## Dimension 8: Metadata

Filter by publication metadata and creators.

| Parameter | Type | Description |
|-----------|------|-------------|
| `designer` | string[] | Games designed by ANY of these people (by slug or ID). |
| `publisher` | string[] | Games published by ANY of these organizations (by slug or ID). |
| `family` | string[] | Games in ANY of these families (by slug or ID). |
| `category` | string[] | Games in ANY of these categories (by slug). |
| `year_min` | integer | Published in or after this year. |
| `year_max` | integer | Published in or before this year. |
| `language_dependence` | string or string[] | Filter by text dependence level: `"no_text"`, `"some_text"`, `"moderate_text"`, `"extensive_text"`, `"unplayable_without_text"`. Useful for finding games suitable for non-native-language groups. |

**Notes:**
- `designer=["cole-wehrle"]` finds all games by Cole Wehrle.
- `year_min=2020&year_max=2025` finds games published in the 2020s.
- `family=["pandemic"]` finds all games in the *Pandemic* family, regardless of type.
- `language_dependence=["no_text", "some_text"]` finds games playable without significant language knowledge -- useful for international groups or non-native speakers.

## Dimension 9: Corpus & Archetype (Aspirational)

Filter by player population or behavioral archetype. This dimension is enabled by the [Player entity](../data-model/players.md) and represents a fundamentally new kind of filtering: "what do players like me think?" rather than "what does the undifferentiated crowd think?"

| Parameter | Type | Description |
|-----------|------|-------------|
| `corpus` | string | Filter by player corpus: `similar_to_player:{id}` or `archetype:{name}`. |
| `corpus_rating_min` | float | Minimum rating within the specified corpus. |

**Example queries:**
- `corpus=similar_to_player:01912f4c-a1b2&corpus_rating_min=4.0` -- "games rated 4.0+ by players whose collection resembles mine"
- `corpus=archetype:solo-gamer&top_at=1` -- "games solo gamers rate highly at 1 player"

**Status:** This dimension is aspirational. The [Player entity](../data-model/players.md) and [archetype model](../data-model/players.md#player-archetypes) define the data structures that make it possible, but the query syntax and implementation details are future RFC topics. Implementations may experiment with corpus-based filtering before the syntax is formally specified.

## Sorting

Results can be sorted by:

| Sort Value | Description |
|------------|-------------|
| `rating_desc` | Highest rated first |
| `rating_asc` | Lowest rated first |
| `confidence_desc` | Most reliable ratings first |
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
