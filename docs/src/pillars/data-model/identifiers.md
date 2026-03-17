# Identifiers

Every entity in the OpenTabletop data model has two native identifiers and can carry any number of external cross-references. This three-layer system balances machine efficiency, human readability, and interoperability with existing platforms.

## UUIDv7

The primary identifier for every entity is a **UUIDv7** -- a universally unique identifier that embeds a millisecond-precision timestamp.

```
01967b3c-5a00-7000-8000-000000000001
└─────────┘
 timestamp
```

### Why UUIDv7

- **Time-sortable.** UUIDv7s sort chronologically by creation time. This means database indexes on primary keys are naturally ordered, IDs in paginated results have a meaningful sequence, and you can extract the approximate creation time from any ID without a database lookup.
- **Globally unique.** No coordination between servers is needed to generate IDs. Any implementation can mint UUIDv7s independently with negligible collision probability.
- **No information leakage.** Unlike sequential integer IDs, you cannot determine how many entities exist by looking at an ID. An ID of `01967b3c-5a00-7000-8000-000000000001` does not tell you whether this is the first game or the hundred-thousandth.
- **Standard format.** UUIDv7 is defined in RFC 9562 and supported by every major language and database.

UUIDv4 was considered but rejected because it is not time-sortable, which degrades B-tree index performance and makes keyset pagination less efficient. Integer auto-increment was considered but rejected because it leaks entity counts, creates coordination requirements in distributed systems, and makes cross-system merging difficult.

## Slugs

Every entity also has a **slug** -- a human-readable, URL-safe identifier:

```
twilight-imperium
war-of-the-ring
reiner-knizia
days-of-wonder
```

### Slug Rules

- Lowercase ASCII letters, digits, and hyphens only
- No leading or trailing hyphens
- No consecutive hyphens
- Maximum 100 characters
- Unique within each entity type (a Game slug and a Person slug may collide, but two Game slugs may not)
- Immutable after creation (if a game is renamed, the slug stays the same; an alias may be added)

### Why Both

UUIDv7 is for machines. Slugs are for humans. Both are valid lookup keys:

```http
GET /games/01967b3c-5a00-7000-8000-000000000001
GET /games/twilight-imperium
```

Both return the same Game entity. The API accepts either form wherever a game identifier is expected. Internally, the slug resolves to the UUIDv7 and all storage and indexing uses the UUID.

Slugs appear in URLs, documentation, examples, and conversation. UUIDv7s appear in machine-to-machine communication, foreign keys, and bulk operations.

## External Identifiers

The `Identifier` entity stores cross-references to external systems:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `game_id` | UUIDv7 | yes | The OpenTabletop entity this identifier belongs to |
| `source` | string | yes | The external system (see below) |
| `external_id` | string | yes | The ID in the external system |

### Known Sources

| Source | Format | Example | Description |
|--------|--------|---------|-------------|
| `bgg` | integer (as string) | `"233078"` | BoardGameGeek thing ID |
| `bgg_family` | integer (as string) | `"55"` | BoardGameGeek family ID |
| `bga` | string | `"twilightimperium"` | Board Game Arena game slug |
| `isbn` | string | `"978-1-63344-363-5"` | ISBN for games sold as books |
| `ean` | string | `"0841333106652"` | EAN/UPC barcode |
| `asin` | string | `"B07DYBSNKP"` | Amazon Standard Identification Number |
| `wikidata` | string | `"Q1748930"` | Wikidata entity ID |

The `source` field is an open vocabulary -- new sources can be added without a specification change. The known sources above are documented as conventions, not an exhaustive list.

### Lookup by External ID

```http
GET /games?identifier_source=bgg&identifier_value=233078
```

Returns the OpenTabletop Game entity that maps to BGG thing ID 233078 (*Twilight Imperium: Fourth Edition*). This is essential for migration: applications moving from BGG's API can look up their existing BGG IDs to find the corresponding OpenTabletop UUIDs.

### Multiple External IDs

A single game can have multiple identifiers from the same source. This handles cases like:

- A game listed separately on BGG for different editions (original and revised)
- Multiple ISBNs for different printings
- Regional EAN/UPC codes

```json
{
  "id": "01967b3c-5a00-7000-8000-000000000001",
  "slug": "twilight-imperium",
  "identifiers": [
    { "source": "bgg", "external_id": "233078" },
    { "source": "bga", "external_id": "twilightimperium" },
    { "source": "ean", "external_id": "0841333106652" },
    { "source": "wikidata", "external_id": "Q1748930" }
  ]
}
```

## Identifier Stability

OpenTabletop identifiers (UUIDv7 and slug) are permanent. Once assigned, they never change and are never reused. If a game is removed from the database, its IDs are retired -- they will return a 410 Gone response, not a 404, and will never be assigned to a different entity.

External identifiers may change if the external system reassigns them, but the OpenTabletop cross-reference is updated to reflect the current state. Historical mappings may be preserved with a `deprecated` flag in future specification versions.
