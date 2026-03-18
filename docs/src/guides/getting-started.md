# Getting Started

There are two ways to use OpenTabletop:

- **Building a server or app?** Start with the [Implementer's Guide](./implementing.md) -- it walks you through database setup, loading sample data, and implementing endpoints step by step.
- **Using an existing API?** Read on. This guide shows you how to query any OpenTabletop-conforming server.

---

The examples below use `{your-server}` as a placeholder -- substitute the base URL of whichever conforming server you are working with. Every conforming server exposes the same endpoints and accepts the same parameters.

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

Response (abbreviated -- full response includes all fields):

```json
{
  "id": "01912f4c-7e3a-7b1a-8c5d-9f0e1a2b3c4d",
  "slug": "spirit-island",
  "name": "Spirit Island",
  "type": "base_game",
  "year_published": 2017,
  "min_players": 1,
  "max_players": 4,
  "min_playtime": 90,
  "max_playtime": 120,
  "community_min_playtime": 75,
  "community_max_playtime": 150,
  "min_age": 13,
  "community_suggested_age": 14,
  "weight": 3.86,
  "rating": 8.22,
  "rating_votes": 42891,
  "rating_confidence": 0.45,
  "mode": "cooperative",
  "top_player_counts": [1, 2, 3],
  "recommended_player_counts": [1, 2, 3, 4],
  "_links": {
    "self": { "href": "/v1/games/spirit-island" },
    "expansions": { "href": "/v1/games/spirit-island/expansions" },
    "effective_properties": { "href": "/v1/games/spirit-island/effective-properties" },
    "player_count_ratings": { "href": "/v1/games/spirit-island/player-count-ratings" },
    "relationships": { "href": "/v1/games/spirit-island/relationships" },
    "experience_playtime": { "href": "/v1/games/spirit-island/experience-playtime" }
  }
}
```

## Filtering Games

The real power is in compound filtering. Find cooperative games for 4 players, under 90 minutes, medium complexity:

```bash
curl "https://{your-server}/v1/games? \
  players=4& \
  community_playtime_max=90& \
  weight_min=2.0&weight_max=3.5& \
  mode=cooperative& \
  sort=bayes_rating&order=desc& \
  limit=10"
```

Response:

```json
{
  "data": [
    {
      "slug": "pandemic",
      "name": "Pandemic",
      "type": "base_game",
      "min_players": 2,
      "max_players": 4,
      "weight": 2.42,
      "rating": 7.6,
      "mode": "cooperative",
      "matched_via": null,
      "_links": { "self": { "href": "/v1/games/pandemic" } }
    }
  ],
  "meta": {
    "total": 1,
    "next_cursor": "MDFhYmMx..."
  },
  "_links": {
    "self": { "href": "/v1/games" },
    "next": { "href": "/v1/games?cursor=MDFhYmMx...&limit=10" }
  }
}
```

Every game in the response satisfies *all* filter dimensions simultaneously (cross-dimension AND). The `matched_via` field is `null` unless `effective=true` is set.

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
curl "https://{your-server}/v1/games? \
  players=6& \
  effective=true& \
  type=base_game"
```

Response -- Spirit Island base game supports only 1-4, but matches because Branch & Claw + Jagged Earth expand it to 6:

```json
{
  "data": [
    {
      "slug": "spirit-island",
      "name": "Spirit Island",
      "type": "base_game",
      "min_players": 1,
      "max_players": 4,
      "matched_via": {
        "type": "expansion_combination",
        "expansions": [
          { "slug": "spirit-island-branch-and-claw", "name": "Spirit Island: Branch & Claw" },
          { "slug": "spirit-island-jagged-earth", "name": "Spirit Island: Jagged Earth" }
        ],
        "effective_properties": {
          "min_players": 1,
          "max_players": 6,
          "weight": 4.07,
          "min_playtime": 105,
          "max_playtime": 180
        },
        "resolution_tier": 1
      }
    }
  ],
  "meta": { "total": 1 },
  "_links": { "self": { "href": "/v1/games" } }
}
```

The `resolution_tier` tells you how the match was derived: `1` = explicit community-curated combination, `2` = computed from individual expansion deltas, `3` = base game properties only.

## Effective Properties

See how a game's properties change with specific expansions:

```bash
curl "https://{your-server}/v1/games/spirit-island/ \
  effective-properties?with=branch-and-claw,jagged-earth"
```

Response:

```json
{
  "base": {
    "min_players": 1,
    "max_players": 4,
    "min_playtime": 90,
    "max_playtime": 120,
    "weight": 3.86,
    "min_age": 13
  },
  "applied_expansions": ["branch-and-claw", "jagged-earth"],
  "effective": {
    "min_players": 1,
    "max_players": 6,
    "min_playtime": 105,
    "max_playtime": 180,
    "weight": 4.07,
    "min_age": 13
  },
  "combination_source": "explicit"
}
```

The `combination_source` indicates which tier of the [three-tier resolution model](../pillars/data-model/property-deltas.md) was used: `"explicit"` (community-curated combination record), `"computed"` (sum of individual expansion deltas), or `"base_only"` (no expansion data available).

## Complex Queries

For queries too complex for URL parameters, use `POST /v1/games/search`:

```bash
curl -X POST https://{your-server}/v1/games/search \
  -H "Content-Type: application/json" \
  -d '{
    "players": 4,
    "effective": true,
    "playtime_max": 90,
    "playtime_source": "community",
    "weight_min": 2.0,
    "weight_max": 3.5,
    "mode": "cooperative",
    "mechanics": ["hand-management", "area-control"],
    "theme_not": ["space"],
    "sort": "bayes_rating",
    "order": "desc",
    "limit": 25
  }'
```

Response:

```json
{
  "data": [
    {
      "slug": "pandemic",
      "name": "Pandemic",
      "type": "base_game",
      "weight": 2.42,
      "rating": 7.6,
      "mode": "cooperative",
      "matched_via": null
    }
  ],
  "meta": {
    "total": 1,
    "next_cursor": "MDFhYmMx..."
  },
  "_links": {
    "self": { "href": "/v1/games/search" },
    "next": { "href": "/v1/games/search?cursor=MDFhYmMx...&limit=25" }
  }
}
```

The compound search supports all 9 filter dimensions -- see the [Implementing Guide](./implementing.md#step-9-implement-compound-search) for the full list. Filters compose with AND across dimensions and OR within dimensions.

## Authentication

The specification defines tiered API key authentication ([ADR-0016](../adr/0016-api-key-auth-tiered-rate-limits.md)). For higher rate limits (600/min) or write access, use an API key:

```bash
curl -H "X-API-Key: your-api-key" \
  https://{your-server}/v1/games
```

## Pagination

All list endpoints use cursor-based pagination ([ADR-0012](../adr/0012-keyset-pagination.md)):

```json
{
  "data": [ "..." ],
  "meta": {
    "total": 142,
    "next_cursor": "MDFhYmMx...",
    "prev_cursor": "MDFhYmMy..."
  },
  "_links": {
    "self": { "href": "/v1/games" },
    "next": { "href": "/v1/games?cursor=MDFhYmMx...&limit=25" },
    "prev": { "href": "/v1/games?before=MDFhYmMy...&limit=25" }
  }
}
```

Use the `next_cursor` value to fetch the next page:

```bash
curl "https://{your-server}/v1/games?cursor=MDFhYmMx...&limit=25"
```

Use `before` with `prev_cursor` to go back:

```bash
curl "https://{your-server}/v1/games?before=MDFhYmMy...&limit=25"
```

## Exploring the Spec

Want to see every endpoint and schema interactively? Bundle the spec and preview it:

```sh
./scripts/bundle-spec.sh
npx @redocly/cli preview-docs spec/bundled/openapi.yaml
```

This opens a browsable API reference in your browser -- useful for understanding the full data model before building against it.

## Next Steps

- **Building a server?** [Implementer's Guide](./implementing.md) -- Database schema, sample data loader, endpoint walkthrough
- [Filter Dimensions](../pillars/filtering/dimensions.md) -- Full reference for all filtering dimensions
- [Expansion Model](../pillars/data-model/property-deltas.md) -- How combinatorial expansion effects work
- [Data Export](../pillars/statistics/export.md) -- Bulk data access for analysis
