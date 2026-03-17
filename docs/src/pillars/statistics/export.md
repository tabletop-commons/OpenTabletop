# Data Export

The export system provides bulk access to data from a conforming implementation in machine-friendly formats. It uses the same filter dimensions as the search API, so you can export targeted slices of the dataset rather than downloading everything.

## Export Endpoint

```http
GET /export/games?format=jsonl&mechanics=cooperative&year_min=2020
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `jsonl` | Output format: `jsonl` or `csv` |
| `include` | string[] | `["base"]` | Data to include (see below) |
| All search filters | -- | -- | Same parameters as `POST /games/search` |

### Include Options

| Value | Description |
|-------|-------------|
| `base` | Core game fields (id, slug, name, type, players, playtime, weight, rating, confidence, community_suggested_age) |
| `taxonomy` | Mechanics, categories, themes, families for each game |
| `people` | Designers, artists, publishers |
| `polls` | Player count ratings (numeric 1-5 per count, with average, vote count, and std dev) |
| `rating_distribution` | Rating histogram (1-10 buckets), std dev, and confidence score |
| `weight_votes` | Weight vote distribution |
| `experience_playtime` | Experience-bucketed playtime data (first_play, learning, experienced, expert multipliers) |
| `age_polls` | Community age recommendation polls |
| `playtime_stats` | Community play time statistics |
| `editions` | Edition metadata and edition deltas (ADR-0035) |
| `identifiers` | External cross-reference IDs |
| `relationships` | GameRelationship edges |
| `deltas` | PropertyModification and ExpansionCombination data |
| `all` | Everything above |

```http
GET /export/games?format=jsonl&include=base,polls,taxonomy&weight_min=3.0
```

## JSON Lines Format

Each line is a self-contained JSON object representing one game with all requested includes:

```jsonl
{"id":"01967b3c-5a00-7000-8000-000000000096","slug":"barrage","name":"Barrage","type":"base_game","min_players":1,"max_players":4,"weight":4.02,"rating":8.12,"mechanics":["worker-placement","area-control","engine-building"],"categories":["strategy","economic"],"player_count_ratings":[{"player_count":1,"average_rating":2.8,"rating_count":312,"rating_stddev":1.2},{"player_count":2,"average_rating":3.9,"rating_count":534,"rating_stddev":0.8},{"player_count":3,"average_rating":4.6,"rating_count":687,"rating_stddev":0.5},{"player_count":4,"average_rating":4.4,"rating_count":498,"rating_stddev":0.7}]}
{"id":"01967b3c-5a00-7000-8000-000000000097","slug":"castles-of-burgundy","name":"The Castles of Burgundy","type":"base_game","min_players":1,"max_players":4,"weight":3.00,"rating":8.28,"mechanics":["dice-rolling","drafting","engine-building"],"categories":["strategy"],"player_count_ratings":[{"player_count":1,"average_rating":3.2,"rating_count":456,"rating_stddev":1.0},{"player_count":2,"average_rating":4.7,"rating_count":1823,"rating_stddev":0.4},{"player_count":3,"average_rating":3.8,"rating_count":987,"rating_stddev":0.8},{"player_count":4,"average_rating":3.3,"rating_count":612,"rating_stddev":0.9}]}
```

JSON Lines (`.jsonl`) is chosen because:
- Each line can be parsed independently -- streaming and parallel processing are trivial.
- Appending new records does not require modifying existing data.
- Tools like `jq`, `pandas`, and `duckdb` handle JSON Lines natively.
- It is the de facto standard for data engineering pipelines.

## CSV Format

Flat tabular export for spreadsheet users and simple analysis:

```csv
id,slug,name,type,min_players,max_players,weight,rating,confidence,mechanics,categories
01967b3c-5a00-7000-8000-000000000096,barrage,Barrage,base_game,1,4,4.02,8.12,0.81,"worker-placement|area-control|engine-building","strategy|economic"
01967b3c-5a00-7000-8000-000000000097,castles-of-burgundy,The Castles of Burgundy,base_game,1,4,3.00,8.28,0.85,"dice-rolling|drafting|engine-building","strategy"
```

CSV limitations:
- Array fields are pipe-delimited within a single column (`cooperative|hand-management`).
- Nested data (polls, vote distributions) is flattened or excluded.
- CSV export supports `include=base,taxonomy` but nested includes like `polls` produce one row per poll entry (game x player_count), not one row per game.

For anything beyond basic game metadata, JSON Lines is the recommended format.

## ExportManifest

Every export response begins with a manifest header (in JSON Lines format) or is accompanied by a manifest endpoint:

```http
GET /export/manifest?format=jsonl&mechanics=cooperative&year_min=2020
```

```json
{
  "export_id": "01967b3c-7000-7000-8000-000000000099",
  "format": "jsonl",
  "filters_applied": {
    "mechanics": ["cooperative"],
    "year_min": 2020
  },
  "includes": ["base", "polls", "taxonomy"],
  "total_games": 342,
  "generated_at": "2026-03-12T10:00:00Z",
  "spec_version": "1.0.0",
  "checksum": "sha256:a1b2c3d4e5f6..."
}
```

The manifest provides:
- **Reproducibility**: The exact filters and includes used, so someone can regenerate the export later.
- **Integrity**: A SHA-256 checksum of the export data.
- **Versioning**: The spec version the data conforms to.
- **Metadata**: Total count, timestamp, unique export ID.

## Streaming

Export responses are streamed. The server begins sending data as soon as the first row is ready, without buffering the entire result set. This means:

- Large exports (100k+ games) work without timeouts.
- Clients can begin processing before the download completes.
- Memory usage is bounded on both client and server.

The `Content-Type` header is `application/x-ndjson` for JSON Lines and `text/csv` for CSV. The `Transfer-Encoding` is `chunked`.

## Rate Limiting

Export endpoints are rate-limited separately from search endpoints. The default limits:

- 10 export requests per hour per API key
- Maximum 100,000 games per export (use filters to stay under)
- No limit on export size in bytes (but larger exports take longer)

These are the specification's recommended defaults. Implementations may adjust limits based on their infrastructure.

For full-dataset exports exceeding the per-request limit, use the `cursor` parameter to paginate through the export in batches.

## Use Cases

- **Academic research**: Export all games with weight votes and player count polls for a study on complexity perception.
- **Alternative ranking systems**: Export ratings and vote counts to compute your own Bayesian ranking.
- **Collection management**: Export your owned games (filtered by a list of IDs) with full metadata for a local database.
- **Data journalism**: Export games by year to analyze trends in board game design.
- **Machine learning**: Export the full dataset as training data for a recommendation engine.
