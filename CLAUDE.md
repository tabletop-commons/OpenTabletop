# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenTabletop** is a community-driven, open-source API specification and data standard for board game data. The project produces an OpenAPI 3.1 specification, controlled vocabularies, sample data, and documentation. It does not ship server implementations or client SDKs -- those are built by adopters using the spec (see ADR-0045).

## Three Pillars

Every contribution should serve at least one pillar:

1. **Standardized Data Model** -- Define board game entities (games, expansions, mechanics, designers, etc.) and their relationships once, correctly, via ADRs. The controlled vocabulary prevents tag proliferation.

2. **Filtering & Windowing** -- The showcase feature. Compound, multi-dimensional filtering across 6 composable dimensions: player count (range + best-at + effective-with-expansions), play time (publisher vs community-reported), weight, game mode & mechanics (AND/OR/NOT), themes, and metadata. Set `effective=true` to filter against expansion-modified properties.

3. **Statistical Foundation** -- Raw, exportable, analyzable data. Player count polls, weight votes, community play times, expansion deltas -- all stored as distributions, not just aggregates. Bulk export in JSON Lines and CSV.

## Key Architectural Concepts

### Combinatorial Expansion Model (ADR-0007)
Expansion effects are combinatorial -- the effective properties depend on which SET of expansions you select, not just summing individual deltas. Three-tier resolution:
1. Explicit `ExpansionCombination` record (community-curated) -- use if exists
2. Individual delta sum (fallback) -- add up individual expansion deltas
3. Base game only -- no expansions applied

Response always includes `combination_source: "explicit" | "computed"` for transparency.

### Dual Play Time (ADR-0014)
Games have both publisher-stated times (from the box -- notoriously optimistic) and community-reported times (from play logs -- more accurate). Filtering defaults to community times when available.

### Player Count Polls (ADR-0010)
Per-player-count voting data (best/recommended/not-recommended), not just a min/max range. Enables "best at exactly 3" vs "supports 3" queries.

## Commands

```bash
# Documentation
mdbook serve docs/                                    # Serve docs locally
mdbook build docs/                                    # Build docs

# Spec validation
npx @stoplight/spectral-cli lint spec/openapi.yaml    # Lint OpenAPI spec
./scripts/bundle-spec.sh                              # Bundle multi-file spec

# ADR validation
./scripts/validate-adrs.sh                            # Check ADR format/numbering
```

## ADR Conventions

- Format: **MADR 4.0.0** (see ADR-0001)
- Location: `docs/src/adr/NNNN-kebab-case-title.md`
- Status lifecycle: `proposed` → `accepted` → `deprecated` | `superseded`
- Numbers are sequential, never reused
- Use `/create-adr` skill to create new ADRs
- Use `/supersede-adr` skill to supersede existing ADRs
- Every ADR requires: frontmatter (status, date), Context, Decision Drivers, Options, Decision, Consequences

## OpenAPI Conventions

- **Spec root**: `spec/openapi.yaml` (bundles all files via `$ref`)
- **Schema names**: PascalCase (`Game`, `PlayerCountPoll`, `ExpansionCombination`)
- **Path files**: kebab-case (`games-{id}-effective-properties.yaml`)
- **Parameter files**: kebab-case grouped by dimension (`player-count-filters.yaml`)
- All list endpoints return `PaginatedResponse` with cursor-based pagination
- All errors use `ErrorResponse` (RFC 9457 Problem Details)
- Related resources use HAL-style `_links` (`{ "href": "...", "title": "..." }`)
- Use `/generate-openapi-component` skill to scaffold new components

## Project Structure

```
spec/           OpenAPI 3.1 specification (source of truth)
data/
  taxonomy/     Controlled vocabularies (mechanics, categories, themes)
  mappings/     BGG bridge mappings for migration
  samples/      Sample game data conforming to the schemas
docs/           mdbook documentation with mermaid diagrams
  src/adr/      Architecture Decision Records (45 ADRs)
  src/pillars/  Three Pillars documentation
tools/          Taxonomy viewer and utilities
scripts/        Utility scripts (bundle, validate)
.claude/skills/ Claude skills for ADR and spec management
```

## Contribution Workflow

1. **Spec changes**: RFC (GitHub Discussion) → community review → steering committee vote → PR with spec change + updated documentation
2. **Data corrections**: GitHub issue using data-correction template
3. **Taxonomy/sample data**: Fork → branch → PR with data changes
