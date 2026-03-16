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
| All search filters | — | — | Same parameters as `POST /games/search` |

### Include Options

| Value | Description |
|-------|-------------|
| `base` | Core game fields (id, slug, name, type, players, playtime, weight, rating) |
| `taxonomy` | Mechanics, categories, themes, families for each game |
| `people` | Designers, artists, publishers |
| `polls` | Player count poll data |
| `weight_votes` | Weight vote distribution |
| `playtime_stats` | Community play time statistics |
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
{"id":"01967b3c-5a00-7000-8000-000000000001","slug":"spirit-island","name":"Spirit Island","type":"base_game","min_players":1,"max_players":4,"weight":3.89,"rating":8.31,"mechanics":["cooperative","hand-management","area-control"],"categories":["strategy","thematic"],"player_count_poll":[{"player_count":1,"best":312,"recommended":589,"not_recommended":142},{"player_count":2,"best":876,"recommended":421,"not_recommended":28}]}
{"id":"01967b3c-5a00-7000-8000-000000000070","slug":"terraforming-mars","name":"Terraforming Mars","type":"base_game","min_players":1,"max_players":5,"weight":3.26,"rating":8.38,"mechanics":["engine-building","hand-management","drafting"],"categories":["strategy","economic"],"player_count_poll":[{"player_count":1,"best":201,"recommended":654,"not_recommended":187},{"player_count":2,"best":412,"recommended":723,"not_recommended":89}]}
```

JSON Lines (`.jsonl`) is chosen because:
- Each line can be parsed independently — streaming and parallel processing are trivial.
- Appending new records does not require modifying existing data.
- Tools like `jq`, `pandas`, and `duckdb` handle JSON Lines natively.
- It is the de facto standard for data engineering pipelines.

## CSV Format

Flat tabular export for spreadsheet users and simple analysis:

```csv
id,slug,name,type,min_players,max_players,weight,rating,mechanics,categories
01967b3c-5a00-7000-8000-000000000001,spirit-island,Spirit Island,base_game,1,4,3.89,8.31,"cooperative|hand-management|area-control","strategy|thematic"
01967b3c-5a00-7000-8000-000000000070,terraforming-mars,Terraforming Mars,base_game,1,5,3.26,8.38,"engine-building|hand-management|drafting","strategy|economic"
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
