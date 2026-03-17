# Pagination

OpenTabletop uses **keyset (cursor) pagination** for all list endpoints (ADR-0012).

## Why Cursor Pagination

| Approach | Performance at scale | Consistent results | Complexity |
|----------|--------------------|--------------------|------------|
| Offset (`?page=50`) | Degrades with large offsets | Rows can shift between pages | Low |
| **Keyset (cursor)** | **Constant performance** | **Consistent** | Medium |
| Page number | Same as offset | Same as offset | Low |

Cursor pagination uses an opaque token that encodes the position in the result set. Performance is constant regardless of how deep you paginate.

## Request Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 25 | 100 | Number of items per page |
| `cursor` | string | (none) | -- | Opaque cursor from a previous response |

## Response Format

```json
{
  "data": [
    { "id": "...", "name": "Spirit Island", ... },
    { "id": "...", "name": "Pandemic", ... }
  ],
  "meta": {
    "total": 1423,
    "next_cursor": "eyJpZCI6IjAxOTM4NWEyLTdj...",
    "prev_cursor": "eyJpZCI6IjAxOTM4MmIxLTRh...",
    "filters_applied": { ... }
  },
  "_links": {
    "self": { "href": "/v1/games?limit=25" },
    "next": { "href": "/v1/games?cursor=eyJpZCI6IjAxOTM4NWEyLTdj...&limit=25" },
    "prev": { "href": "/v1/games?cursor=eyJpZCI6IjAxOTM4MmIxLTRh...&limit=25" }
  }
}
```

## Usage

```bash
# First page
curl "https://api.opentabletop.org/v1/games?limit=25"

# Next page (use next_cursor from previous response)
curl "https://api.opentabletop.org/v1/games?cursor=eyJpZCI6IjAxOTM4NWEyLTdj...&limit=25"
```

## Notes

- Cursors are **opaque** -- do not parse or construct them; they may change format between API versions
- Cursors are **stable** -- using a cursor always returns the next logical page, even if items are added or removed
- `prev_cursor` is `null` on the first page; `next_cursor` is `null` on the last page
- Filters and sort order are encoded in the cursor -- you do not need to repeat them on subsequent pages
