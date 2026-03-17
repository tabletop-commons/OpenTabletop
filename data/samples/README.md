# Sample Data

This directory contains demonstration game records that conform to the OpenAPI schemas in `spec/schemas/`. Each subdirectory represents a single game and its associated data -- expansions, player count polls, effective properties, relationships, and more.

## Purpose

- **Understanding the data model** -- See how a fully populated game record looks in practice
- **Testing implementations** -- Load these records into a conforming server and verify endpoint responses match the expected shapes
- **Seeding development databases** -- Start with real-world-shaped data rather than synthetic fixtures

## Structure

Each game directory contains one or more YAML files, each corresponding to an API response or entity:

```
spirit-island/
  game.yaml                  # Game entity (base game)
  expansions.yaml            # Expansion family (all expansion entities)
  player-count-ratings.yaml  # Per-count community ratings
  experience-playtime.yaml   # Experience-bucketed playtime data
terraforming-mars/
  game.yaml                  # Game entity (base game)
  player-count-ratings.yaml  # Per-count community ratings
```

## Relationship to spec/examples/

The `spec/examples/` directory contains concise inline examples that are `$ref`'d by the OpenAPI specification for API documentation generators (Swagger UI, ReDoc). Those files serve a different purpose and should not be moved.

The samples here are richer, standalone datasets organized per-game -- suitable for loading into a database, not for embedding in API docs.

## Data Accuracy

These are **illustrative samples**, not authoritative data. Values are realistic but approximate -- based on publicly available community data as of early 2026. For authoritative game data, consult the source communities directly.
