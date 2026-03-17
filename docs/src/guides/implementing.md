# Implementing the Spec

OpenTabletop is a specification, not a product. This guide walks you through building a conforming server -- from exploring the spec to loading data to implementing the hard parts. It is written as a team playbook: follow the steps in order and you will end up with a fully-fledged, conforming API.

## Step 1: Explore the Specification

The OpenAPI 3.1 specification at `spec/openapi.yaml` is the source of truth. Start by browsing it interactively:

```sh
# Bundle the multi-file spec into a single file
./scripts/bundle-spec.sh

# Preview in Swagger UI (any static server works)
npx @redocly/cli preview-docs spec/bundled/openapi.yaml
```

This gives you a browsable view of every endpoint, schema, and parameter. Spend time here before writing code -- the spec is dense and the filtering model is unusually rich.

Key sections to read first:
- The `Game` schema -- the core entity with type discriminator, dual playtime, and community signals
- The `SearchRequest` schema -- the compound filtering model (this is where OpenTabletop differs most from other APIs)
- The `PlayerCountRating` schema -- per-count numeric ratings, not just min/max
- The `ExpansionCombination` and `PropertyModification` schemas -- the three-tier expansion resolution model

## Step 2: Design Your Database

The specification is format-agnostic, but most implementations will use a relational database. A recommended PostgreSQL schema is provided at [`data/samples/schema.sql`](https://github.com/tabletop-commons/OpenTabletop/blob/main/data/samples/schema.sql).

The schema covers:

```mermaid
erDiagram
    games ||--o{ game_mechanics : has
    games ||--o{ game_categories : has
    games ||--o{ game_themes : has
    games ||--o{ game_relationships : source
    games ||--o{ player_count_ratings : has
    games ||--o{ experience_playtime : has
    games ||--o{ expansion_combinations : base
    games ||--o{ property_modifications : base
    games ||--o{ game_credits : has
    games ||--o{ game_editions : has
    games ||--o{ game_awards : has
    games ||--o{ game_snapshots : has
    games ||--o{ external_identifiers : has
    games ||--o{ alternate_names : has
    games }o--o| games : parent
    mechanics ||--o{ game_mechanics : tagged
    categories ||--o{ game_categories : tagged
    themes ||--o{ game_themes : tagged
    people ||--o{ game_credits : credited
    publishers ||--o{ game_editions : publishes
    awards ||--o{ game_awards : given
```

To create the schema:

```sh
createdb opentabletop
psql opentabletop < data/samples/schema.sql
```

Key design decisions in the schema:
- **UUIDv7 primary keys** -- Time-ordered for index locality (ADR-0008)
- **Slugs as unique secondary keys** -- Immutable, URL-safe, used for API lookups
- **Junction tables for taxonomy** -- `game_mechanics`, `game_categories`, `game_themes` enable the AND/OR/NOT filtering
- **Separate `player_count_ratings` table** -- One row per (game, player_count) pair, not embedded JSON
- **`expansion_combinations` table** -- Explicit tier-1 records for the three-tier resolution model
- **Generated `tsvector` column** -- Full-text search across name and description (ADR-0027)

As your schema evolves, use versioned SQL migration files following [ADR-0029](../adr/0029-versioned-sql-migrations.md). The initial schema is the starting point; you will add raw vote tables, expansion delta seed data, and other tables as your implementation grows. A typical migration directory looks like:

```
migrations/
  0001_raw_vote_tables.sql
  0002_seed_expansion_deltas.sql
  0003_add_game_snapshots.sql
```

Use any SQL-native migration runner (golang-migrate, Flyway, dbmate, or plain `psql`). Never use ORM-generated migrations -- the schema is the spec's recommended design and should be maintained as explicit SQL.

### Data Model Checklist: Database

- [ ] Schema matches [ER diagram](../pillars/data-model/overview.md) -- all entities and join tables present
- [ ] [UUIDv7](../pillars/data-model/identifiers.md) primary keys, slug unique secondary keys
- [ ] [Entity types](../pillars/data-model/entity-type-criteria.md) supported: base_game, expansion, standalone_expansion, promo, accessory, fan_expansion
- [ ] [Dual playtime](../pillars/data-model/playtime.md) columns: both publisher-stated and community-reported
- [ ] [Rating](../pillars/data-model/rating-model.md) columns: average_rating, rating_count, rating_distribution, rating_stddev
- [ ] [Weight](../pillars/data-model/weight-model.md) columns: weight + weight_votes
- [ ] [Taxonomy](../pillars/data-model/taxonomy.md) join tables: game_mechanics, game_categories, game_themes
- [ ] [Relationships](../pillars/data-model/relationships.md) table: typed directed edges with ordinal
- [ ] Full-text search vector column with GIN index

## Step 3: Set Up Local Development

Before writing any application code, get a local development stack running. A `docker-compose.yml` with PostgreSQL and Redis gives you a reproducible environment that mirrors production:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: opentabletop
      POSTGRES_USER: ot
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./data/samples/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

  redis:
    image: redis:8-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

The key detail is the `docker-entrypoint-initdb.d` volume mount: PostgreSQL automatically runs SQL files in that directory on first startup, so your schema is loaded without a manual step.

Create a `.env` file for your application (12-factor config from environment, per [ADR-0020](../adr/0020-twelve-factor-design.md)):

```sh
DATABASE_URL=postgresql://ot:localdev@localhost:5432/opentabletop
PORT=8080
LOG_LEVEL=debug
```

Start the stack and verify the database is ready:

```sh
docker compose up -d
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Reference the [Deploying Guide](./deploying.md) for production setup including Kubernetes manifests, observability, TLS, and capacity planning.

### Data Model Checklist: Local Development

- [ ] `docker-compose.yml` starts PostgreSQL with schema auto-loaded via `initdb.d`
- [ ] `.env` file provides `DATABASE_URL`, `PORT`, `LOG_LEVEL` ([ADR-0020](../adr/0020-twelve-factor-design.md))
- [ ] Application reads all config from environment variables, never hardcoded
- [ ] Database connection pooling configured (10-20 connections per process)

## Step 4: Load Sample Data

The `data/samples/` directory contains demonstration records for *Spirit Island* and *Terraforming Mars*. A loader script is provided:

```sh
# From the spec repository root (where package.json lives):
npm install

# Load into your database
node scripts/load-samples.js --connection "postgresql://localhost/opentabletop"

# Or dry-run to see the SQL without executing
node scripts/load-samples.js --dry-run
```

The loader reads the YAML files, maps them to the schema from Step 2, and inserts the records. It also loads the controlled vocabularies from `data/taxonomy/` (mechanics, categories, themes).

After loading, verify the data:

```sql
SELECT name, type, weight, average_rating FROM games;
SELECT g.name, pcr.player_count, pcr.average_rating
  FROM player_count_ratings pcr
  JOIN games g ON g.id = pcr.game_id
  ORDER BY g.name, pcr.player_count;
```

### Data Model Checklist: Sample Data

- [ ] [Controlled vocabulary](../pillars/data-model/taxonomy.md) loaded: mechanics, categories, themes from `data/taxonomy/`
- [ ] Sample games loaded with all required fields (id, slug, name, type)
- [ ] [Player count ratings](../pillars/data-model/player-count.md) seeded for sample games
- [ ] [Experience playtime](../pillars/data-model/playtime.md) data present for sample games
- [ ] [Expansion combinations](../pillars/data-model/property-deltas.md) seeded for sample expansion families

## Step 5: Implement Core Endpoints

Start with the read-only endpoints that form the backbone of the API:

1. **`GET /v1/games`** -- List games with query parameter filtering. Support `players`, `weight_min`, `weight_max`, `type`, `mode`, `sort`, and `effective` as query parameters. Use keyset (cursor-based) pagination, not offset-based ([ADR-0012](../adr/0012-keyset-pagination.md)).

2. **`GET /v1/games/{id}`** -- Single game by UUID or slug. Return the full `Game` schema. Support `?include=expansions` for embedding related resources ([ADR-0017](../adr/0017-selective-resource-embedding.md)). Include full `_links` with self, expansions, effective_properties, player_count_ratings, relationships, and experience_playtime.

3. **`GET /v1/games/{id}/expansions`** -- List expansions for a base game. Filter `games` where `parent_game_id` matches.

4. **`GET /v1/mechanics`**, **`GET /v1/categories`**, **`GET /v1/themes`** -- List taxonomy terms. Return canonical slugs and display names. These endpoints power the controlled vocabulary that prevents tag proliferation ([ADR-0009](../adr/0009-controlled-vocabulary-taxonomy.md)).

5. **`GET /v1/search?q=...`** -- Full-text search via PostgreSQL `tsvector`. Weighted across name (highest), short description, and full description. See [ADR-0027](../adr/0027-postgresql-fulltext-search.md).

6. **`GET /healthz`** and **`GET /readyz`** -- Liveness ("process is alive") and readiness ("can serve traffic, database connected") probes. These are required for Kubernetes orchestration and should be implemented early.

All list endpoints should return paginated responses with `_links` for navigation ([ADR-0018](../adr/0018-hal-style-links.md)) and support the `?include` parameter for embedding related resources ([ADR-0017](../adr/0017-selective-resource-embedding.md)).

### Data Model Checklist: Core Endpoints

- [ ] [Game entity](../pillars/data-model/games.md) returns all required fields (id, slug, name, type) plus optional fields
- [ ] [Identifier lookup](../pillars/data-model/identifiers.md): both UUID and slug resolve to the same entity
- [ ] [Taxonomy endpoints](../pillars/data-model/taxonomy.md): mechanics, categories, themes return canonical slugs
- [ ] [Relationships](../pillars/data-model/relationships.md): typed edges queryable (expands, reimplements, integrates_with)
- [ ] [Age fields](../pillars/data-model/age-recommendation.md): min_age (publisher) + community_suggested_age
- [ ] `_links` include self, expansions, effective_properties, player_count_ratings, relationships
- [ ] 404 returns [RFC 9457](../adr/0015-rfc9457-error-responses.md) Problem Details format

## Step 6: Implement Player Count & Experience Playtime

These two sub-resources expose the per-count and per-experience-level data that makes OpenTabletop's filtering model possible.

### Player Count Ratings

**`GET /v1/games/{id}/player-count-ratings`** -- Returns per-player-count community ratings. Each row contains a player count, average rating (1-5 scale), vote count, and standard deviation.

Player count is not just a range; it is a distribution of quality across the supported range. A game that "supports 1-5 players" may be excellent at 3, good at 2, and actively bad at 5. The per-count ratings capture this nuance.

Example response for *Terraforming Mars*:

```json
{
  "data": [
    { "player_count": 1, "average_rating": 2.1, "rating_count": 1277, "rating_stddev": 1.2 },
    { "player_count": 2, "average_rating": 4.2, "rating_count": 1222, "rating_stddev": 0.7 },
    { "player_count": 3, "average_rating": 4.7, "rating_count": 1407, "rating_stddev": 0.5 },
    { "player_count": 4, "average_rating": 3.6, "rating_count": 1246, "rating_stddev": 1.0 },
    { "player_count": 5, "average_rating": 2.3, "rating_count": 1141, "rating_stddev": 1.1 }
  ]
}
```

From this data, consumers can derive `top_player_counts` (counts rated above 4.0) and `recommended_player_counts` (counts rated above 3.0). The specification stores raw data, not derived labels -- different applications may use different thresholds.

### Experience Playtime

**`GET /v1/games/{id}/experience-playtime`** -- Returns play time estimates bucketed by experience level. Four levels with per-game multipliers derived from community play logs:

| Level | Description | Typical Multiplier |
|-------|-------------|-------------------|
| `first_play` | Everyone is new to the game | ~1.5x |
| `learning` | 1-3 prior plays, still referencing rules | ~1.25x |
| `experienced` | 4+ plays, knows the rules well (baseline) | 1.0x |
| `expert` | Optimized play, minimal downtime | ~0.85x |

Different games have fundamentally different experience curves: a party game has near-zero first-play penalty while a heavy euro may take 2x longer on first play. Per-game multipliers from community play logs capture these differences accurately.

See [Player Count Model](../pillars/data-model/player-count.md) and [Play Time Model](../pillars/data-model/playtime.md) for the full specification.

### Data Model Checklist: Player Count & Experience Playtime

- [ ] [Player count ratings](../pillars/data-model/player-count.md): per-count 1-5 numeric scale (not legacy three-tier)
- [ ] Ratings include average_rating, rating_count, and rating_stddev per count
- [ ] [Experience-bucketed playtime](../pillars/data-model/playtime.md): four levels (first_play, learning, experienced, expert)
- [ ] Per-game multipliers derived from play logs, not global defaults
- [ ] `sufficient_data` flag indicates whether game-specific or global multipliers are in use
- [ ] Derived fields on Game entity: `top_player_counts`, `recommended_player_counts`

## Step 7: Implement Relationships

**`GET /v1/games/{id}/relationships`** -- Returns typed, directed relationship edges for a game. The `GameRelationship` entity captures how games connect: expansions extend base games, reimplementations share lineage, compilations contain other products.

### Relationship Types

| Type | Direction | Description |
|------|-----------|-------------|
| `expands` | expansion -> base | Source adds content to target; requires target to play |
| `reimplements` | new -> old | Source is a new version of target with mechanical changes |
| `contains` | collection -> item | Source physically includes target (big-box, compilation) |
| `requires` | dependent -> dependency | Source cannot be used without target |
| `recommends` | game -> game | Source suggests target as a companion |
| `integrates_with` | game <-> game | Source and target can be combined for a unified experience |

The endpoint should support filtering by `type` and `direction` (inbound/outbound):

```http
GET /v1/games/spirit-island/relationships?type=expands&direction=inbound
```

For symmetric relationships like `integrates_with`, both directions are stored so queries work from either side without special-casing.

See [Game Relationships](../pillars/data-model/relationships.md) for the full specification, including the Spirit Island family tree and Brass reimplementation case studies.

### Data Model Checklist: Relationships

- [ ] [Relationship types](../pillars/data-model/relationships.md): all six types supported (expands, reimplements, contains, requires, recommends, integrates_with)
- [ ] Directed edges: source_game_id -> target_game_id with relationship_type
- [ ] Symmetric relationships (`integrates_with`) stored in both directions
- [ ] Filter by `type` and `direction` parameters
- [ ] `ordinal` field for display ordering (e.g., expansion release order)
- [ ] `_links` include source and target game references

## Step 8: Implement Effective Properties

**`GET /v1/games/{id}/effective-properties?with=slug1,slug2`** -- Returns the effective (expansion-modified) properties for a game given a specific set of expansions. This is the endpoint that powers the "what if I own these expansions?" question.

### Three-Tier Resolution

The system resolves effective properties using a three-tier strategy:

```
Tier 1: Look up ExpansionCombination record for the exact expansion set -> use if found
Tier 2: Sum individual PropertyModification deltas -> use as fallback
Tier 3: Return base game properties -> lowest confidence
```

The response must include `combination_source` (one of `"explicit"`, `"computed"`, or `"base_only"`) so consumers know how the effective properties were derived:

```json
{
  "base_game": "spirit-island",
  "expansions": ["spirit-island-branch-and-claw", "spirit-island-jagged-earth"],
  "combination_source": "explicit",
  "effective_properties": {
    "min_players": 1,
    "max_players": 6,
    "weight": 4.56,
    "min_playtime": 90,
    "max_playtime": 150,
    "top_at": [2, 3, 4],
    "recommended_at": [1, 2, 3, 4, 5, 6]
  }
}
```

### Implementation Notes

- **Tier 1** is a direct lookup: find an `expansion_combinations` row whose `expansion_ids` matches the requested set exactly (order irrelevant).
- **Tier 2** requires applying `property_modifications` for each requested expansion. For `set` modifications, the last one wins (by release date). For `add` modifications, sum the values. For `multiply`, apply multiplicatively.
- **Tier 3** is a simple pass-through of the base game's properties.

Multi-expansion combinations produce different results than summing individual deltas. This is why explicit combination records exist -- non-linear interactions (e.g., a campaign expansion making 3-player games better) are captured by community-curated data.

See [Property Deltas & Combinations](../pillars/data-model/property-deltas.md) and [Effective Mode](../pillars/filtering/effective-mode.md) for the full specification and worked examples.

### Data Model Checklist: Effective Properties

- [ ] [Three-tier expansion resolution](../pillars/data-model/property-deltas.md): explicit -> computed -> base_only
- [ ] `combination_source` field in response: `"explicit"`, `"computed"`, or `"base_only"`
- [ ] Tier 1: exact-match lookup on `expansion_combinations` by expansion set
- [ ] Tier 2: `PropertyModification` delta sum with correct `set`/`add`/`multiply` semantics
- [ ] Tier 3: base game properties pass-through when no delta data exists
- [ ] Effective properties include: min/max_players, min/max_playtime, weight, top_at, recommended_at, min_age

## Step 9: Implement Compound Search

The `POST /v1/games/search` endpoint is the showcase feature. It accepts a `SearchRequest` JSON body with up to 9 filter dimensions. The composition rules:

- **Cross-dimension**: AND (all active dimensions must be satisfied)
- **Within dimension**: OR (any value within one dimension matches)
- **Exclusion**: `_not` parameters remove matches

### The 9 Filter Dimensions

1. **Rating & Confidence** -- `rating_min`, `rating_max`, `min_rating_votes`, `confidence_min`
2. **Weight** -- `weight_min`, `weight_max`, `min_weight_votes`
3. **Player Count** -- `players`, `players_min`, `players_max`, `top_at`, `recommended_at`
4. **Play Time** -- `playtime_min`, `playtime_max`, `playtime_source`, `playtime_experience`
5. **Age** -- `age_min`, `age_max`, `age_source`
6. **Game Type & Mechanics** -- `type`, `mode`, `mechanics`, `mechanics_all`, `mechanics_not`
7. **Theme** -- `theme`, `theme_not`
8. **Metadata** -- `designer`, `publisher`, `category`, `year_min`, `year_max`
9. **Corpus & Archetype** -- `corpus`, `corpus_rating_min` (aspirational)

Example: "cooperative games, weight 2.5-3.5, best at exactly 4 players" requires joining across `games`, `game_mechanics`, and `player_count_ratings` in a single query.

### Effective Mode on Search

When `effective=true` is set on a search request, the filtering system does not just search base game properties -- it searches across all known expansion combinations. This is what makes queries like "games that support 6 players with expansions" possible.

The response includes `matched_via` metadata when a game matches through an expansion combination rather than its base properties:

```json
{
  "matched_via": {
    "type": "expansion_combination",
    "expansions": [
      { "slug": "spirit-island-jagged-earth", "name": "Jagged Earth" }
    ],
    "effective_properties": {
      "min_players": 1,
      "max_players": 6
    },
    "resolution_tier": 1
  }
}
```

The `resolution_tier` (1 = explicit combination, 2 = delta sum, 3 = base fallback) tells consumers the confidence level of the match.

See [Search Endpoint](../pillars/filtering/search-endpoint.md) and [Effective Mode](../pillars/filtering/effective-mode.md) for the full request/response schemas and worked examples. See [Filtering & Windowing](../pillars/filtering/overview.md) for the compositional model.

### Data Model Checklist: Compound Search

- [ ] [Compound filtering](../pillars/filtering/overview.md): 9 dimensions, AND cross-dimension, OR within-dimension
- [ ] [Effective mode](../pillars/filtering/effective-mode.md): `effective=true` filters against expansion-modified properties
- [ ] `matched_via` response metadata when match comes from expansion combination
- [ ] `resolution_tier` in response: 1 (explicit), 2 (computed), 3 (base fallback)
- [ ] [Rating confidence](../pillars/data-model/rating-model.md): confidence score (0.0-1.0) exposed in Game entity
- [ ] Mechanics filtering: `mechanics` (OR), `mechanics_all` (AND), `mechanics_not` (NOT)
- [ ] Request validation returns [RFC 9457](../specification/errors.md) Problem Details on invalid input

## Step 10: Add the Materialization Pipeline

The Game entity's aggregate fields (`average_rating`, `bayes_rating`, `rank_overall`, etc.) are **materialized** from raw input data -- not computed on every API request. This separation of raw votes from computed aggregates is a deliberate architectural decision documented in [Materialization](../pillars/data-model/materialization.md).

### Raw Vote Tables

Add raw vote tables via SQL migration. These store the individual, immutable records that feed materialization:

```sql
-- migrations/0001_raw_vote_tables.sql
CREATE TABLE rating_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id     UUID NOT NULL REFERENCES games(id),
    score       NUMERIC(3,1) NOT NULL CHECK (score BETWEEN 1.0 AND 10.0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE weight_votes_raw (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id     UUID NOT NULL REFERENCES games(id),
    weight      NUMERIC(3,2) NOT NULL CHECK (weight BETWEEN 1.0 AND 5.0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Raw records are append-only. A new rating vote is inserted; it does not update a running total in place. This preserves the full distribution for statistical analysis and makes the raw data exportable (Pillar 3).

### Vote Submission Endpoint

**`POST /v1/games/{id}/ratings`** -- Submit a raw rating vote. Accepts a numeric score (1.0-10.0), inserts it into `rating_votes`, and returns the created record. The submitted vote is not immediately reflected in the Game entity's aggregate fields -- it becomes visible after the next materialization run.

### Materialization Endpoint

**`POST /v1/admin/materialize`** -- Trigger a batch recomputation of all materialized aggregates. This endpoint runs the same logic as the scheduled cron job and is useful during development and after bulk data imports. In production, protect it with admin-only authentication.

### Execution Order

The materialization must run in dependency order:

1. **Per-game aggregates first** -- `average_rating`, `rating_count`, `rating_distribution`, `rating_stddev`, `weight`, `weight_votes`, experience multipliers, `top_player_counts`, `recommended_player_counts`
2. **Global parameters second** -- Compute the global mean rating and Dirichlet prior parameters from the freshly-updated per-game averages
3. **Bayesian ratings third** -- `bayes_rating` and `rating_confidence` depend on the global parameters from step 2
4. **Rankings last** -- `rank_overall` sorts all games by `bayes_rating`, which must be current before ranking

Steps 1-3 can be parallelized per-game. Step 4 is a single global sort.

The job must be **idempotent** -- safe to re-run at any time without producing incorrect results. Each run reads the current raw data and overwrites the materialized fields. Running the job twice with no new votes produces identical output.

See [Materialization](../pillars/data-model/materialization.md) for the full architectural rationale and the [Deploying Guide](./deploying.md) "Materialization Jobs" section for Kubernetes CronJob configuration.

### Data Model Checklist: Materialization

- [ ] [Materialization architecture](../pillars/data-model/materialization.md): raw input data (Tier 1) separated from materialized aggregates (Tier 2)
- [ ] Raw vote tables: `rating_votes`, `weight_votes_raw` created via versioned migration
- [ ] Vote submission endpoint accepts and stores individual votes
- [ ] Materialization execution order: per-game -> global mean -> Bayesian -> rankings
- [ ] Job is idempotent: re-running produces identical output
- [ ] `updated_at` field on Game entity indicates when aggregates were last refreshed
- [ ] [Bayesian rating](../pillars/data-model/rating-model.md): `bayes_rating` computed using Dirichlet prior from global parameters
- [ ] [Ranking](../pillars/data-model/rating-model.md): `rank_overall` computed from sorted `bayes_rating`

## Step 11: Containerize

Build your server as a multi-stage container image. The pattern is language-agnostic -- replace the build stage with your stack:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

# Stage 2: Runtime (distroless -- see ADR-0021)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 8080
CMD ["dist/server.js"]
```

Key requirements:
- **Distroless base** ([ADR-0021](../adr/0021-distroless-container-images.md)) -- No shell, no package manager, minimal attack surface. Target < 50MB final image.
- **Health endpoints** -- Expose `/healthz` (liveness) and `/readyz` (readiness).
- **Tag by git SHA**, never `latest` ([ADR-0024](../adr/0024-immutable-infrastructure.md)):

```sh
docker build -t ghcr.io/your-org/opentabletop:$(git rev-parse --short HEAD) .
docker push ghcr.io/your-org/opentabletop:$(git rev-parse --short HEAD)
```

### Data Model Checklist: Containerization

- [ ] [Distroless image](../adr/0021-distroless-container-images.md): no shell, no package manager in runtime stage
- [ ] Multi-stage build: build tools not present in final image
- [ ] [Git SHA tagging](../adr/0024-immutable-infrastructure.md): image tagged by commit hash, never `latest`
- [ ] Health endpoints: `/healthz` and `/readyz` responding inside the container
- [ ] [12-factor config](../adr/0020-twelve-factor-design.md): all configuration from environment variables

## Step 12: Generate Client SDKs

Any OpenAPI-compatible code generator can produce client libraries from the spec:

| Generator | Languages | Command |
|-----------|-----------|---------|
| [openapi-generator](https://openapi-generator.tech/) | 50+ (Rust, Python, TypeScript, Java, Go, ...) | `openapi-generator-cli generate -i spec/bundled/openapi.yaml -g python -o my-sdk/` |
| [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) | Go | `oapi-codegen -package api spec/bundled/openapi.yaml > api.gen.go` |
| [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) | TypeScript | `npx openapi-typescript spec/bundled/openapi.yaml -o schema.d.ts` |

### Data Model Checklist: SDKs

- [ ] [Bundled spec](../specification/overview.md) used as generator input (not the multi-file source)
- [ ] Generated SDK validates response shapes against spec schemas
- [ ] SDK handles [keyset pagination](../adr/0012-keyset-pagination.md) cursors
- [ ] SDK includes typed models for `SearchRequest` and `Game` entities

## Step 13: Validate Conformance

To verify your implementation conforms to the spec:

1. **Schema validation** -- Ensure your API responses match the schemas in `spec/schemas/`
2. **Endpoint coverage** -- Implement the paths defined in `spec/paths/`
3. **Pagination** -- Use keyset (cursor-based) pagination per ADR-0012
4. **Error format** -- Return RFC 9457 Problem Details per ADR-0015
5. **Filtering semantics** -- AND across dimensions, OR within dimensions, NOT via `_not` parameters
6. **Sample data round-trip** -- Load the sample data, query it through your API, and verify the response shapes match the spec examples

A formal conformance test suite is a future goal (see [ADR-0045](../adr/0045-specification-only-repository.md)).

### Data Model Checklist: Conformance

- [ ] [Data provenance](../pillars/data-model/data-provenance.md): input contracts documented, voter context captured
- [ ] All responses match schemas in `spec/schemas/`
- [ ] [Keyset pagination](../adr/0012-keyset-pagination.md) on all list endpoints
- [ ] [HAL-style _links](../adr/0018-hal-style-links.md) on all entity responses
- [ ] [Three-tier expansion resolution](../pillars/data-model/property-deltas.md) produces correct results for sample data
- [ ] [Effective mode](../pillars/filtering/effective-mode.md) on compound search returns correct `matched_via` metadata
- [ ] [Materialization](../pillars/data-model/materialization.md) pipeline produces correct aggregate values from raw votes
- [ ] All six [relationship types](../pillars/data-model/relationships.md) queryable with correct directionality

## Recommended Architecture

The ADRs in the [Infrastructure & Implementation Guidance](../adr/index.md) section document recommended patterns for production deployments:

- **Twelve-factor design** (ADR-0020) -- Config from environment, stateless processes, port binding
- **Container images** (ADR-0021) -- Distroless base images, multi-stage builds
- **Observability** (ADR-0023) -- Structured JSON logging, OpenTelemetry traces and metrics
- **Database** (ADR-0027, ADR-0029) -- PostgreSQL with full-text search, versioned SQL migrations
- **Caching** (ADR-0028) -- Cache-Control headers and ETags

These are recommendations, not requirements. A conforming server built with Django and MySQL is just as valid as one built with Axum and PostgreSQL, provided it implements the API contract correctly.

## Next: Deploying

Once your server is built and passing conformance checks, see the [Deploying & Operating](./deploying.md) guide for container images, Kubernetes manifests, database operations, observability setup, and production checklists.
