# Architecture Decision Records

This section documents all Architecture Decision Records (ADRs) for the OpenTabletop project, following the [MADR 4.0.0](https://adr.github.io/madr/) format. ADRs are numbered sequentially (never reused or reordered) but grouped by domain below for discoverability.

## Governance & Process

Decisions about how the project operates: format standards, licensing, versioning, contribution workflows, and documentation tooling.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](0001-use-madr-for-decisions.md) | Use MADR 4.0.0 for Architecture Decision Records | Accepted |
| [ADR-0003](0003-dual-licensing.md) | Dual Licensing -- Apache 2.0 for Code, CC-BY-4.0 for Spec | Accepted |
| [ADR-0004](0004-rfc-based-governance.md) | RFC-Based Governance with Steering Committee Transition | Accepted |
| [ADR-0005](0005-semantic-versioning.md) | Semantic Versioning for Spec and Implementations | Accepted |
| [ADR-0030](0030-structured-data-contributions.md) | Structured Data Contributions via Issue Templates | Accepted |
| [ADR-0031](0031-rfc-with-reference-implementation.md) | RFC Changes Require Reference Implementation | Superseded by ADR-0045 |
| [ADR-0033](0033-mdbook-mermaid-documentation.md) | mdbook with Mermaid for Documentation | Accepted |
| [ADR-0045](0045-specification-only-repository.md) | Specification-Only Repository | Accepted |

## Core Data Model

The foundational entity model: game entity design, relationships, taxonomy, player count polls, playtime modeling, editions, and classification criteria.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0006](0006-unified-game-entity.md) | Unified Game Entity with Type Discriminator | Accepted |
| [ADR-0007](0007-combinatorial-expansion-property-model.md) | Combinatorial Expansion Property Model | Accepted |
| [ADR-0008](0008-uuidv7-with-slugs.md) | UUIDv7 Primary Keys with URL Slugs and BGG Cross-References | Accepted |
| [ADR-0009](0009-controlled-vocabulary-taxonomy.md) | Controlled Vocabulary for Taxonomy | Accepted |
| [ADR-0010](0010-structured-player-count-polls.md) | Structured Per-Player-Count Polling Data | Accepted |
| [ADR-0011](0011-typed-game-relationships.md) | Typed Game Relationships with JSONB Metadata | Accepted |
| [ADR-0014](0014-dual-playtime-model.md) | Dual Playtime Model -- Publisher-Stated and Community-Reported | Accepted |
| [ADR-0034](0034-experience-bucketed-playtime.md) | Experience-Bucketed Playtime Adjustment | Proposed |
| [ADR-0035](0035-edition-level-property-deltas.md) | Edition-Level Property Deltas | Accepted |
| [ADR-0037](0037-entity-type-classification-criteria.md) | Formal Entity Type Classification Criteria | Proposed |
| [ADR-0043](0043-player-count-sentiment-model-improvements.md) | Player Count Sentiment Model Improvements | Proposed |
| [ADR-0044](0044-player-entity-and-collection-data.md) | Player Entity and Collection Data | Proposed |
| [ADR-0045](0045-specification-only-repository.md) | Specification-Only Repository | Accepted |

## API Design

Protocol, pagination, filtering, error handling, resource embedding, hypermedia, caching, and bulk export.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0002](0002-use-rest-with-openapi.md) | Use REST with OpenAPI 3.2 as the API Protocol | Accepted |
| [ADR-0012](0012-keyset-pagination.md) | Keyset (Cursor-Based) Pagination | Accepted |
| [ADR-0013](0013-compound-filtering.md) | Compound Multi-Dimensional Filtering as Core Feature | Accepted |
| [ADR-0015](0015-rfc9457-error-responses.md) | RFC 9457 Problem Details for Error Responses | Accepted |
| [ADR-0016](0016-api-key-auth-tiered-rate-limits.md) | API Key Authentication with Tiered Rate Limits | Accepted |
| [ADR-0017](0017-selective-resource-embedding.md) | Selective Resource Embedding via ?include Parameter | Accepted |
| [ADR-0018](0018-hal-style-links.md) | HAL-Style Hypermedia Links for Discoverability | Accepted |
| [ADR-0019](0019-bulk-data-export.md) | Bulk Data Export Endpoints | Accepted |
| [ADR-0028](0028-cache-control-etag.md) | Cache-Control Headers and ETags | Accepted |

## Infrastructure & Implementation Guidance

Cloud-native design, deployment, observability, search, database migrations, and legacy system migration. These ADRs document recommended patterns for operators building conforming servers -- they are guidance, not requirements of the standard. ADR-0025 (reference server) and ADR-0026 (SDK generation) are superseded by ADR-0045.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0020](0020-twelve-factor-design.md) | Twelve-Factor Application Design | Accepted |
| [ADR-0021](0021-distroless-container-images.md) | Distroless Container Images | Accepted |
| [ADR-0022](0022-kubernetes-native-deployment.md) | Kubernetes-Native Deployment with Docker Compose Fallback | Accepted |
| [ADR-0023](0023-opentelemetry-observability.md) | OpenTelemetry for Unified Observability | Accepted |
| [ADR-0024](0024-immutable-infrastructure.md) | Immutable Infrastructure with Blue-Green Deployment | Accepted |
| [ADR-0025](0025-rust-axum-sqlx-reference-server.md) | Rust with Axum and SQLx for the Reference Server | Superseded by ADR-0045 |
| [ADR-0026](0026-openapi-generator-sdks.md) | OpenAPI Generator for SDK Generation | Superseded by ADR-0045 |
| [ADR-0027](0027-postgresql-fulltext-search.md) | PostgreSQL Full-Text Search | Accepted |
| [ADR-0029](0029-versioned-sql-migrations.md) | Versioned Plain SQL Migration Files | Accepted |
| [ADR-0032](0032-strangler-fig-legacy-migration.md) | Strangler Fig Pattern for BGG Legacy Migration | Accepted |

## Data Model Extensions

Extensions to the core model for BGG parity, publisher/designer utility, and analytical capabilities.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0036](0036-time-series-snapshots-and-trend-analysis.md) | Time-Series Snapshots and Trend Analysis | Proposed |
| [ADR-0038](0038-alternate-names-and-localization.md) | Alternate Names and Localization Support | Proposed |
| [ADR-0039](0039-extended-game-credits.md) | Extended Game Credits with Role Taxonomy | Proposed |
| [ADR-0040](0040-edition-product-and-physical-metadata.md) | Edition Product and Physical Metadata | Proposed |
| [ADR-0041](0041-community-signals-and-aggregate-statistics.md) | Community Signals and Aggregate Statistics | Proposed |
| [ADR-0042](0042-game-awards-and-recognition.md) | Game Awards and Recognition | Proposed |

---

## Chronological Index

All ADRs in sequential order for reference. Numbers are append-only and never reused.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](0001-use-madr-for-decisions.md) | Use MADR 4.0.0 for Architecture Decision Records | Accepted |
| [ADR-0002](0002-use-rest-with-openapi.md) | Use REST with OpenAPI 3.2 as the API Protocol | Accepted |
| [ADR-0003](0003-dual-licensing.md) | Dual Licensing -- Apache 2.0 for Code, CC-BY-4.0 for Spec | Accepted |
| [ADR-0004](0004-rfc-based-governance.md) | RFC-Based Governance with Steering Committee Transition | Accepted |
| [ADR-0005](0005-semantic-versioning.md) | Semantic Versioning for Spec and Implementations | Accepted |
| [ADR-0006](0006-unified-game-entity.md) | Unified Game Entity with Type Discriminator | Accepted |
| [ADR-0007](0007-combinatorial-expansion-property-model.md) | Combinatorial Expansion Property Model | Accepted |
| [ADR-0008](0008-uuidv7-with-slugs.md) | UUIDv7 Primary Keys with URL Slugs and BGG Cross-References | Accepted |
| [ADR-0009](0009-controlled-vocabulary-taxonomy.md) | Controlled Vocabulary for Taxonomy | Accepted |
| [ADR-0010](0010-structured-player-count-polls.md) | Structured Per-Player-Count Polling Data | Accepted |
| [ADR-0011](0011-typed-game-relationships.md) | Typed Game Relationships with JSONB Metadata | Accepted |
| [ADR-0012](0012-keyset-pagination.md) | Keyset (Cursor-Based) Pagination | Accepted |
| [ADR-0013](0013-compound-filtering.md) | Compound Multi-Dimensional Filtering as Core Feature | Accepted |
| [ADR-0014](0014-dual-playtime-model.md) | Dual Playtime Model -- Publisher-Stated and Community-Reported | Accepted |
| [ADR-0015](0015-rfc9457-error-responses.md) | RFC 9457 Problem Details for Error Responses | Accepted |
| [ADR-0016](0016-api-key-auth-tiered-rate-limits.md) | API Key Authentication with Tiered Rate Limits | Accepted |
| [ADR-0017](0017-selective-resource-embedding.md) | Selective Resource Embedding via ?include Parameter | Accepted |
| [ADR-0018](0018-hal-style-links.md) | HAL-Style Hypermedia Links for Discoverability | Accepted |
| [ADR-0019](0019-bulk-data-export.md) | Bulk Data Export Endpoints | Accepted |
| [ADR-0020](0020-twelve-factor-design.md) | Twelve-Factor Application Design | Accepted |
| [ADR-0021](0021-distroless-container-images.md) | Distroless Container Images | Accepted |
| [ADR-0022](0022-kubernetes-native-deployment.md) | Kubernetes-Native Deployment with Docker Compose Fallback | Accepted |
| [ADR-0023](0023-opentelemetry-observability.md) | OpenTelemetry for Unified Observability | Accepted |
| [ADR-0024](0024-immutable-infrastructure.md) | Immutable Infrastructure with Blue-Green Deployment | Accepted |
| [ADR-0025](0025-rust-axum-sqlx-reference-server.md) | Rust with Axum and SQLx for the Reference Server | Superseded by ADR-0045 |
| [ADR-0026](0026-openapi-generator-sdks.md) | OpenAPI Generator for SDK Generation | Superseded by ADR-0045 |
| [ADR-0027](0027-postgresql-fulltext-search.md) | PostgreSQL Full-Text Search | Accepted |
| [ADR-0028](0028-cache-control-etag.md) | Cache-Control Headers and ETags | Accepted |
| [ADR-0029](0029-versioned-sql-migrations.md) | Versioned Plain SQL Migration Files | Accepted |
| [ADR-0030](0030-structured-data-contributions.md) | Structured Data Contributions via Issue Templates | Accepted |
| [ADR-0031](0031-rfc-with-reference-implementation.md) | RFC Changes Require Reference Implementation | Superseded by ADR-0045 |
| [ADR-0032](0032-strangler-fig-legacy-migration.md) | Strangler Fig Pattern for BGG Legacy Migration | Accepted |
| [ADR-0033](0033-mdbook-mermaid-documentation.md) | mdbook with Mermaid for Documentation | Accepted |
| [ADR-0034](0034-experience-bucketed-playtime.md) | Experience-Bucketed Playtime Adjustment | Proposed |
| [ADR-0035](0035-edition-level-property-deltas.md) | Edition-Level Property Deltas | Accepted |
| [ADR-0036](0036-time-series-snapshots-and-trend-analysis.md) | Time-Series Snapshots and Trend Analysis | Proposed |
| [ADR-0037](0037-entity-type-classification-criteria.md) | Formal Entity Type Classification Criteria | Proposed |
| [ADR-0038](0038-alternate-names-and-localization.md) | Alternate Names and Localization Support | Proposed |
| [ADR-0039](0039-extended-game-credits.md) | Extended Game Credits with Role Taxonomy | Proposed |
| [ADR-0040](0040-edition-product-and-physical-metadata.md) | Edition Product and Physical Metadata | Proposed |
| [ADR-0041](0041-community-signals-and-aggregate-statistics.md) | Community Signals and Aggregate Statistics | Proposed |
| [ADR-0042](0042-game-awards-and-recognition.md) | Game Awards and Recognition | Proposed |
| [ADR-0043](0043-player-count-sentiment-model-improvements.md) | Player Count Sentiment Model Improvements | Proposed |
| [ADR-0044](0044-player-entity-and-collection-data.md) | Player Entity and Collection Data | Proposed |
| [ADR-0045](0045-specification-only-repository.md) | Specification-Only Repository | Accepted |
