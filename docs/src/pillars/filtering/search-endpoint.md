# Search Endpoint

The primary filtering endpoint is `POST /games/search`. It accepts a JSON body containing all filter parameters, sort order, and pagination controls. A `GET /games` endpoint with query parameters exists for simple lookups, but the POST endpoint is the recommended interface for multi-dimensional queries.

## Why POST for Search

Complex filter queries involve arrays, nested parameters, and boolean logic that map poorly to URL query strings:

- `mechanics=["cooperative","hand-management"]&mechanics_not=["dice-rolling"]` is awkward as query parameters and ambiguous across HTTP client implementations.
- URL length limits (practical limit around 2000 characters) can be exceeded by queries with many filter values.
- JSON bodies have well-defined semantics for arrays, nulls, and nested objects.

The `POST /games/search` endpoint is not creating a resource — it is a query. This follows the established pattern used by Elasticsearch, Algolia, and other search APIs. The endpoint returns `200 OK`, not `201 Created`.

## Request Schema

```json
{
  "players": 4,
  "players_min": null,
  "players_max": null,
  "best_at": null,
  "recommended_at": null,
  "effective": false,

  "playtime_min": null,
  "playtime_max": 90,
  "community_playtime_min": null,
  "community_playtime_max": null,
  "playtime_source": "publisher",

  "weight_min": 2.0,
  "weight_max": 3.5,
  "effective_weight": false,

  "type": ["base_game", "standalone_expansion"],
  "mode": null,
  "mechanics": ["cooperative"],
  "mechanics_all": null,
  "mechanics_not": null,

  "theme": null,
  "theme_not": ["space"],

  "designer": null,
  "publisher": null,
  "family": null,
  "category": null,
  "year_min": null,
  "year_max": null,
  "rating_min": null,
  "min_rating_votes": null,
  "min_weight_votes": null,

  "sort": "rating_desc",
  "limit": 20,
  "cursor": null
}
```

All fields are optional. Omitted or `null` fields are treated as inactive filters (no constraint on that dimension).

### Field Types

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `players` | integer | null | Exact player count filter |
| `players_min` | integer | null | Minimum player count range |
| `players_max` | integer | null | Maximum player count range |
| `best_at` | integer | null | Community best player count |
| `recommended_at` | integer | null | Community recommended player count |
| `effective` | boolean | false | Enable expansion-aware search |
| `playtime_min` | integer | null | Minimum play time in minutes |
| `playtime_max` | integer | null | Maximum play time in minutes |
| `community_playtime_min` | integer | null | Minimum community-reported play time |
| `community_playtime_max` | integer | null | Maximum community-reported play time |
| `playtime_source` | string | "publisher" | Time source for `playtime_min`/`max`: "publisher" or "community" |
| `weight_min` | float | null | Minimum complexity weight (1.0-5.0) |
| `weight_max` | float | null | Maximum complexity weight (1.0-5.0) |
| `effective_weight` | boolean | false | Use expansion-modified weights |
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
| `rating_min` | float | null | Minimum community rating (1.0-10.0) |
| `min_rating_votes` | integer | null | Minimum rating vote count |
| `min_weight_votes` | integer | null | Minimum weight vote count |
| `sort` | string | "rating_desc" | Sort order (see [Dimensions](./dimensions.md)) |
| `limit` | integer | 20 | Results per page (1-100) |
| `cursor` | string | null | Pagination cursor from previous response |

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

- `weight_min` and `weight_max` must be between 1.0 and 5.0
- `rating_min` must be between 1.0 and 10.0
- `limit` must be between 1 and 100
- `type` values must be valid game type discriminators
- `mechanics`, `theme`, `category` values must be valid slugs in the taxonomy
- `playtime_source` must be "publisher" or "community"
- `sort` must be a valid sort key
- Unknown fields are ignored (forward compatibility)
