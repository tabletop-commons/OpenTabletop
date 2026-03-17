# Response Metadata

Every search response includes a `meta` object alongside the `data` array. The metadata provides pagination controls, filter echo-back, and aggregate information about the result set.

## Response Structure

```json
{
  "data": [
    { "...game object..." },
    { "...game object..." }
  ],
  "meta": {
    "total": 87,
    "limit": 20,
    "cursor": "eyJyYXRpbmciOjcuNTQsImlkIjoiMDE5NjdiM2MtNWEwMC03MDAwIn0=",
    "filters_applied": {
      "players": 4,
      "playtime_max": 90,
      "playtime_source": "community",
      "weight_min": 2.0,
      "weight_max": 3.5,
      "mechanics": ["cooperative"],
      "theme_not": ["space"]
    },
    "sort": "rating_desc",
    "effective": false,
    "include_integrations": false
  }
}
```

## Meta Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total number of games matching the filter across all pages. |
| `limit` | integer | The page size used for this response (echoed from request or default). |
| `cursor` | string or null | Opaque pagination cursor. Pass this as the `cursor` parameter in the next request to get the next page. `null` means this is the last page. |
| `filters_applied` | object | Echo of all active filters. Only includes non-null, non-default parameters. |
| `sort` | string | The sort order used. |
| `effective` | boolean | Whether effective mode was active for this query. |
| `include_integrations` | boolean | Whether `integrates_with` combinations were included in effective mode. Only meaningful when `effective` is `true`. |

## FilterSummary (filters_applied)

The `filters_applied` object echoes back every filter that was active in the query, using the same field names as the request body. This serves two purposes:

1. **Debugging.** Consumers can verify that their query was interpreted correctly. If you sent `playtime_source: "community"` but see `playtime_source: "publisher"` in the response, something went wrong.
2. **Permalink construction.** A frontend can reconstruct the exact query from the response metadata, enabling shareable filter URLs.

Only active filters appear. Default values and null parameters are omitted:

```json
// Request with these defaults:
{
  "type": ["base_game", "standalone_expansion"],
  "sort": "rating_desc",
  "limit": 20
}

// Response filters_applied is empty because all values are defaults:
{
  "filters_applied": {}
}
```

```json
// Request with explicit non-default type:
{
  "type": ["base_game", "expansion"],
  "sort": "rating_desc"
}

// Response includes type because it differs from default:
{
  "filters_applied": {
    "type": ["base_game", "expansion"]
  }
}
```

## Pagination

The `cursor` field implements keyset pagination. See [Pagination](../../specification/pagination.md) for details.

- First request: omit `cursor` (or set to `null`).
- Next page: pass the `cursor` value from the previous response.
- Last page: `cursor` is `null` -- no more results.

The cursor is an opaque string. Do not parse, construct, or modify it. Its format may change between API versions.

## Total Count

The `total` field provides the count of all matching games, not just those on the current page. This enables UI patterns like "Showing 1-20 of 87 results."

Computing exact totals can be expensive for very broad queries. The specification allows implementations to return an estimate for totals above a configurable threshold (default: 10,000). If the total is estimated, a boolean `total_estimated` field is set to `true`:

```json
{
  "meta": {
    "total": 15200,
    "total_estimated": true
  }
}
```

For most filtered queries, the total is small enough to be exact.

## Future: Facet Counts

A planned extension to the response metadata is **facet counts** -- aggregate counts of how many results match each value of a given dimension. For example:

```json
{
  "meta": {
    "facets": {
      "mechanics": {
        "cooperative": 87,
        "hand-management": 42,
        "deck-building": 31,
        "area-control": 18
      },
      "weight_histogram": {
        "1.0-1.5": 3,
        "1.5-2.0": 12,
        "2.0-2.5": 28,
        "2.5-3.0": 25,
        "3.0-3.5": 15,
        "3.5-4.0": 4
      }
    }
  }
}
```

Facet counts enable progressive filtering UIs where the user sees how many results each additional filter would produce. This is on the [statistics roadmap](../statistics/roadmap.md) but not in the initial specification.
