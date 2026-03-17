# Getting Started

This guide walks through your first interactions with any OpenTabletop-conforming API. The examples below use `{your-server}` as a placeholder -- substitute the base URL of whichever conforming server you are working with. Every conforming server exposes the same endpoints and accepts the same parameters.

## Base URL

Point your requests at the `/v1` root of your chosen server:

```
https://{your-server}/v1
```

The specification requires that conforming implementations provide unauthenticated read-only access with rate limiting (default: 60 requests/minute by IP). See [ADR-0016](../adr/0016-api-key-auth-tiered-rate-limits.md).

## Your First Request

Fetch a game by its slug:

```bash
curl https://{your-server}/v1/games/spirit-island
```

Response:

```json
{
  "id": "019385a2-7c4f-7000-8000-000000000001",
  "slug": "spirit-island",
  "name": "Spirit Island",
  "type": "base_game",
  "year_published": 2017,
  "min_players": 1,
  "max_players": 4,
  "min_playtime_minutes": 90,
  "max_playtime_minutes": 120,
  "community_playtime_median_minutes": 110,
  "weight": 3.9,
  "mode": "cooperative",
  "average_rating": 8.3,
  "_links": {
    "self": { "href": "/v1/games/spirit-island" },
    "expansions": { "href": "/v1/games/spirit-island/expansions" },
    "effective_properties": { "href": "/v1/games/spirit-island/effective-properties" },
    "player_count_poll": { "href": "/v1/games/spirit-island/player-count-poll" },
    "relationships": { "href": "/v1/games/spirit-island/relationships" }
  }
}
```

## Filtering Games

The real power is in compound filtering. Find cooperative games for 4 players, under 90 minutes, medium complexity:

```bash
curl "https://{your-server}/v1/games?\
players=4&\
community_playtime_max=90&\
weight_min=2.0&weight_max=3.5&\
mode=cooperative&\
sort=bayes_rating&order=desc&\
limit=10"
```

## Searching in Other Languages

Games carry alternate names in any language. Search works across all of them:

```bash
# Search by Japanese name
curl "https://{your-server}/v1/search?q=ブラス：バーミンガム"

# Search by Korean name
curl "https://{your-server}/v1/search?q=브라스:%20버밍엄"
```

Both return the same *Brass: Birmingham* entity. The full-text search indexes all alternate names with language-appropriate tokenizers, so users can discover games in their own language regardless of what language the game was originally published in.

## Expansion-Aware Filtering

Add `effective=true` to filter against properties that include expansion modifications:

```bash
# Games that support 6 players with at least one expansion
curl "https://{your-server}/v1/games?\
players=6&\
effective=true&\
type=base_game"
```

## Effective Properties

See how a game's properties change with specific expansions:

```bash
curl "https://{your-server}/v1/games/spirit-island/\
effective-properties?with=branch-and-claw,jagged-earth"
```

## Complex Queries

For queries too complex for URL parameters, use `POST /games/search`:

```bash
curl -X POST https://{your-server}/v1/games/search \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "players": { "exact": 4, "effective": true },
      "playtime": { "max": 90, "source": "community" },
      "weight": { "min": 2.0, "max": 3.5 },
      "mode": "cooperative",
      "mechanics": { "any": ["hand-management", "area-control"] },
      "theme": { "not": ["space"] }
    },
    "sort": { "field": "bayes_rating", "order": "desc" },
    "limit": 25
  }'
```

## Authentication

The specification defines tiered API key authentication ([ADR-0016](../adr/0016-api-key-auth-tiered-rate-limits.md)). For higher rate limits (600/min) or write access, use an API key:

```bash
curl -H "X-API-Key: your-api-key" \
  https://{your-server}/v1/games
```

## Pagination

All list endpoints use cursor-based pagination:

```json
{
  "data": [ ... ],
  "meta": {
    "total": 142,
    "next_cursor": "eyJpZCI6IjAxOTM4...",
    "prev_cursor": null
  },
  "_links": {
    "next": { "href": "/v1/games?cursor=eyJpZCI6IjAxOTM4...&limit=25" },
    "prev": null
  }
}
```

Use the `next_cursor` value to fetch the next page:

```bash
curl "https://{your-server}/v1/games?cursor=eyJpZCI6IjAxOTM4...&limit=25"
```

## Next Steps

- [Filter Dimensions](../pillars/filtering/dimensions.md) -- Full reference for all 6 filter dimensions
- [Expansion Model](../pillars/data-model/property-deltas.md) -- How combinatorial expansion effects work
- [Data Export](../pillars/statistics/export.md) -- Bulk data access for analysis
