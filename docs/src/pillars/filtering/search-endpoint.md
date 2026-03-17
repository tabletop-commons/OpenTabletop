# Search Endpoint

The primary filtering endpoint is `POST /games/search`. It accepts a JSON body containing all filter parameters, sort order, and pagination controls. A `GET /games` endpoint with query parameters exists for simple lookups, but the POST endpoint is the recommended interface for multi-dimensional queries.

## Why POST for Search

Complex filter queries involve arrays, nested parameters, and boolean logic that map poorly to URL query strings:

- `mechanics=["cooperative","hand-management"]&mechanics_not=["dice-rolling"]` is awkward as query parameters and ambiguous across HTTP client implementations.
- URL length limits (practical limit around 2000 characters) can be exceeded by queries with many filter values.
- JSON bodies have well-defined semantics for arrays, nulls, and nested objects.

The `POST /games/search` endpoint is not creating a resource -- it is a query. This follows the established pattern used by Elasticsearch, Algolia, and other search APIs. The endpoint returns `200 OK`, not `201 Created`.

## Request Schema

```json
{
  // Dimension 1: Rating & Confidence
  "rating_min": null,
  "rating_max": null,
  "min_rating_votes": null,
  "confidence_min": null,

  // Dimension 2: Weight
  "weight_min": 2.0,
  "weight_max": 3.5,
  "effective_weight": false,
  "min_weight_votes": null,

  // Dimension 3: Player Count
  "players": 4,
  "players_min": null,
  "players_max": null,
  "top_at": null,
  "recommended_at": null,
  "effective": false,              // search across expansion combinations
  "include_integrations": false,   // include integrates_with products in effective mode
  "edition": null,                 // edition slug for edition-specific resolution

  // Dimension 4: Play Time
  "playtime_min": null,
  "playtime_max": 90,
  "community_playtime_min": null,
  "community_playtime_max": null,
  "playtime_source": "publisher",  // "publisher" or "community"
  "playtime_experience": null,     // "first_play", "learning", "experienced", "expert"

  // Dimension 5: Age Recommendation
  "age_min": null,
  "age_max": null,
  "community_age_min": null,
  "community_age_max": null,
  "age_source": "publisher",       // "publisher" or "community"

  // Dimension 6: Game Type & Mechanics
  "type": ["base_game", "standalone_expansion"],
  "mode": null,                    // shorthand: "all", "playable", "addons"
  "mechanics": ["cooperative"],    // OR logic
  "mechanics_all": null,           // AND logic
  "mechanics_not": null,           // exclusion

  // Dimension 7: Theme
  "theme": null,                   // OR logic
  "theme_not": ["space"],          // exclusion

  // Dimension 8: Metadata
  "designer": null,
  "publisher": null,
  "family": null,
  "category": null,
  "year_min": null,
  "year_max": null,
  "language_dependence": null,

  // Dimension 9: Corpus & Archetype (aspirational)
  "corpus": null,
  "corpus_rating_min": null,

  // Resource embedding
  "include": null,                 // e.g., ["mechanics", "experience_playtime"]

  // Pagination & sort
  "sort": "rating_desc",
  "limit": 20,
  "cursor": null
}
```

All fields are optional. Omitted or `null` fields are treated as inactive filters (no constraint on that dimension).

### Field Types

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `rating_min` | float | null | Minimum community rating (1.0-10.0) |
| `rating_max` | float | null | Maximum community rating (1.0-10.0) |
| `min_rating_votes` | integer | null | Minimum rating vote count |
| `confidence_min` | float | null | Minimum rating confidence score (0.0-1.0) |
| `weight_min` | float | null | Minimum complexity weight (1.0-5.0) |
| `weight_max` | float | null | Maximum complexity weight (1.0-5.0) |
| `effective_weight` | boolean | false | Use expansion-modified weights |
| `min_weight_votes` | integer | null | Minimum weight vote count |
| `players` | integer | null | Exact player count filter |
| `players_min` | integer | null | Minimum player count range |
| `players_max` | integer | null | Maximum player count range |
| `top_at` | integer | null | Community highly-rated player count |
| `recommended_at` | integer | null | Community acceptable player count |
| `effective` | boolean | false | Enable expansion-aware search |
| `include_integrations` | boolean | false | Include `integrates_with` products in effective mode combinations |
| `edition` | string | null | Edition slug or ID for edition-specific property resolution. See [Effective Mode](./effective-mode.md). |
| `playtime_min` | integer | null | Minimum play time in minutes |
| `playtime_max` | integer | null | Maximum play time in minutes |
| `community_playtime_min` | integer | null | Minimum community-reported play time |
| `community_playtime_max` | integer | null | Maximum community-reported play time |
| `playtime_source` | string | "publisher" | Time source for `playtime_min`/`max`: "publisher" or "community" |
| `playtime_experience` | string | null | Experience adjustment: "first_play", "learning", "experienced", "expert" |
| `age_min` | integer | null | Minimum age (source-toggled) |
| `age_max` | integer | null | Maximum age (source-toggled) |
| `community_age_min` | integer | null | Minimum community-suggested age |
| `community_age_max` | integer | null | Maximum community-suggested age |
| `age_source` | string | "publisher" | Age source for `age_min`/`max`: "publisher" or "community" |
| `type` | string[] | ["base_game", "standalone_expansion"] | Game type filter |
| `mode` | string | null | Shorthand: "all", "playable", "addons" |
| `mechanics` | string[] | null | Any of these mechanics (OR) |
| `mechanics_all` | string[] | null | All of these mechanics (AND) |
| `mechanics_not` | string[] | null | None of these mechanics (NOT) |
| `theme` | string[] | null | Any of these themes (OR) |
| `theme_not` | string[] | null | None of these themes (NOT) |
| `designer` | string[] | null | Any of these designers (slug or UUID) |
| `publisher` | string[] | null | Any of these publishers (slug or UUID) |
| `family` | string[] | null | Any of these families (slug or UUID) |
| `category` | string[] | null | Any of these categories (slug) |
| `year_min` | integer | null | Published in or after this year |
| `year_max` | integer | null | Published in or before this year |
| `language_dependence` | string[] | null | Filter by text dependence level |
| `corpus` | string | null | Filter by player corpus (aspirational). See [Dimensions: Corpus & Archetype](./dimensions.md#dimension-9-corpus--archetype-aspirational). |
| `corpus_rating_min` | float | null | Minimum rating within the specified corpus (aspirational). |
| `include` | string[] | null | Embed related resources in response (e.g., `["mechanics", "experience_playtime"]`). See [ADR-0017](../../adr/0017-selective-resource-embedding.md). |
| `sort` | string | "rating_desc" | Sort order (see [Dimensions](./dimensions.md)) |
| `limit` | integer | 20 | Results per page (1-100) |
| `cursor` | string | null | Pagination cursor from previous response |

**Dimensional weight filters:** Implementations that support the [detailed weight mode](../data-model/weight-model.md#detailed-mode-dimensional-survey) may also accept per-dimension weight filters (`weight_rules_complexity_min`, `weight_strategic_depth_min`, etc.). See [Dimensions: Dimensional Weight Filters](./dimensions.md#dimensional-weight-filters-implementation-dependent).

## GET Equivalent

For simple queries, `GET /games` accepts a subset of parameters as query strings:

```http
GET /games?players=4&playtime_max=90&mechanics=cooperative&sort=rating_desc&limit=20
```

Array parameters use comma-separated values in GET:

```http
GET /games?mechanics=cooperative,hand-management&theme_not=space
```

The GET endpoint supports all the same parameters but is less ergonomic for complex queries. Use POST when:
- You have more than 3-4 active filters
- You use array parameters with multiple values
- You use both inclusion and exclusion parameters on the same dimension
- Your query might exceed URL length limits

## Response Schema

See [Response Metadata](./response-meta.md) for the full response structure.

## Validation

The API validates the request body and returns [RFC 9457 Problem Details](../../specification/errors.md) for validation errors:

```json
{
  "type": "https://api.opentabletop.org/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "weight_min must be between 1.0 and 5.0",
  "errors": [
    {
      "field": "weight_min",
      "message": "must be between 1.0 and 5.0",
      "value": 6.0
    }
  ]
}
```

### Validation Rules

- `rating_min` and `rating_max` must be between 1.0 and 10.0
- `confidence_min` must be between 0.0 and 1.0
- `weight_min` and `weight_max` must be between 1.0 and 5.0
- `limit` must be between 1 and 100
- `type` values must be valid game type discriminators
- `mechanics`, `theme`, `category` values must be valid slugs in the taxonomy
- `playtime_source` must be "publisher" or "community"
- `age_source` must be "publisher" or "community"
- `playtime_experience` must be "first_play", "learning", "experienced", or "expert"
- `language_dependence` values must be valid dependence levels
- `sort` must be a valid sort key
- Unknown fields are ignored (forward compatibility)
