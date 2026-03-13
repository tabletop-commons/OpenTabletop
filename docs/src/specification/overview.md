# OpenAPI Specification Overview

The OpenTabletop API is defined by an OpenAPI 3.1 specification in the `spec/` directory. This spec is the **single source of truth** — all implementations (reference server, SDKs) are derived from it (ADR-0002).

## File Organization

The spec is split across multiple files for maintainability, bundled into a single file for distribution:

```
spec/
├── openapi.yaml           # Root document (bundles via $ref)
├── info.yaml              # API metadata, contact, license
├── paths/                 # One file per endpoint group
│   ├── games.yaml         # GET /games (with all filter params)
│   ├── games-{id}.yaml    # GET /games/{id}
│   ├── search.yaml        # GET /search, POST /games/search
│   └── ...
├── schemas/               # One file per data type
│   ├── Game.yaml
│   ├── ExpansionCombination.yaml
│   ├── PlayerCountPoll.yaml
│   └── ...
├── parameters/            # Grouped by filter dimension
│   ├── player-count-filters.yaml
│   ├── playtime-filters.yaml
│   └── ...
└── examples/              # Concrete data examples
    ├── game-spirit-island.yaml
    └── ...
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Schema names | PascalCase | `ExpansionCombination` |
| Path files | kebab-case | `games-{id}-effective-properties.yaml` |
| Parameter files | kebab-case by dimension | `player-count-filters.yaml` |
| Enum values | snake_case | `base_game`, `standalone_expansion` |
| Query params | snake_case | `weight_min`, `community_playtime_max` |

## Working with the Spec

```bash
# Validate
npx @stoplight/spectral-cli lint spec/openapi.yaml

# Bundle into single file
./scripts/bundle-spec.sh

# Generate SDKs
./scripts/generate-sdks.sh

# View in Swagger UI
npx @redocly/cli preview-docs spec/openapi.yaml
```

## Adding New Components

Use the `/generate-openapi-component` Claude skill, or follow these steps:

1. Create the schema/path/parameter file in the appropriate directory
2. Add a `$ref` to `spec/openapi.yaml`
3. Create an example in `spec/examples/` if applicable
4. Run validation to ensure no broken references
