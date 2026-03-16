# Summary

- [Introduction](./introduction.md)

# The Three Pillars

- [Pillar 1: Standardized Data Model](./pillars/data-model/overview.md)
  - [Game Entity](./pillars/data-model/games.md)
  - [Game Relationships](./pillars/data-model/relationships.md)
  - [Property Deltas & Combinations](./pillars/data-model/property-deltas.md)
  - [Taxonomy](./pillars/data-model/taxonomy.md)
  - [Taxonomy Criteria](./pillars/data-model/taxonomy-criteria.md)
  - [Entity Type Criteria](./pillars/data-model/entity-type-criteria.md)
  - [People & Organizations](./pillars/data-model/people.md)
  - [Player Count Model](./pillars/data-model/player-count.md)
  - [Play Time Model](./pillars/data-model/playtime.md)
  - [Age Recommendation Model](./pillars/data-model/age-recommendation.md)
  - [Identifiers](./pillars/data-model/identifiers.md)
  - [Data Provenance & Bias](./pillars/data-model/data-provenance.md)
- [Pillar 2: Filtering & Windowing](./pillars/filtering/overview.md)
  - [Filter Dimensions](./pillars/filtering/dimensions.md)
  - [Dimension Composition](./pillars/filtering/composition.md)
  - [Effective Mode](./pillars/filtering/effective-mode.md)
  - [Real-World Examples](./pillars/filtering/examples.md)
  - [Search Endpoint](./pillars/filtering/search-endpoint.md)
  - [Response Metadata](./pillars/filtering/response-meta.md)
- [Pillar 3: Statistical Foundation](./pillars/statistics/overview.md)
  - [Data Structures](./pillars/statistics/data-structures.md)
  - [Data Export](./pillars/statistics/export.md)
  - [Trend Analysis](./pillars/statistics/trends.md)
  - [Roadmap](./pillars/statistics/roadmap.md)

# Architecture

- [System Overview](./architecture/overview.md)
- [Cloud-Native Design](./architecture/cloud-native.md)
- [Legacy Migration](./architecture/legacy-migration.md)

# Specification

- [OpenAPI Spec Overview](./specification/overview.md)
- [Pagination](./specification/pagination.md)
- [Error Handling](./specification/errors.md)

# Architecture Decision Records

- [ADR Index](./adr/index.md)
  - [Governance & Process]()
    - [ADR-0001: Use MADR 4.0.0](./adr/0001-use-madr-for-decisions.md)
    - [ADR-0003: Dual Licensing](./adr/0003-dual-licensing.md)
    - [ADR-0004: RFC-Based Governance](./adr/0004-rfc-based-governance.md)
    - [ADR-0005: Semantic Versioning](./adr/0005-semantic-versioning.md)
    - [ADR-0030: Structured Data Contributions](./adr/0030-structured-data-contributions.md)
    - [ADR-0031: RFC with Reference Implementation](./adr/0031-rfc-with-reference-implementation.md)
    - [ADR-0033: mdbook with Mermaid](./adr/0033-mdbook-mermaid-documentation.md)
  - [Core Data Model]()
    - [ADR-0006: Unified Game Entity](./adr/0006-unified-game-entity.md)
    - [ADR-0007: Combinatorial Expansion Model](./adr/0007-combinatorial-expansion-property-model.md)
    - [ADR-0008: UUIDv7 with URL Slugs](./adr/0008-uuidv7-with-slugs.md)
    - [ADR-0009: Controlled Vocabulary Taxonomy](./adr/0009-controlled-vocabulary-taxonomy.md)
    - [ADR-0010: Player Count Polls](./adr/0010-structured-player-count-polls.md)
    - [ADR-0011: Typed Game Relationships](./adr/0011-typed-game-relationships.md)
    - [ADR-0014: Dual Playtime Model](./adr/0014-dual-playtime-model.md)
    - [ADR-0034: Experience-Bucketed Playtime](./adr/0034-experience-bucketed-playtime.md)
    - [ADR-0035: Edition-Level Property Deltas](./adr/0035-edition-level-property-deltas.md)
    - [ADR-0037: Entity Type Classification Criteria](./adr/0037-entity-type-classification-criteria.md)
  - [API Design]()
    - [ADR-0002: REST with OpenAPI 3.2](./adr/0002-use-rest-with-openapi.md)
    - [ADR-0012: Keyset Pagination](./adr/0012-keyset-pagination.md)
    - [ADR-0013: Compound Filtering](./adr/0013-compound-filtering.md)
    - [ADR-0015: RFC 9457 Error Responses](./adr/0015-rfc9457-error-responses.md)
    - [ADR-0016: API Key Auth & Rate Limits](./adr/0016-api-key-auth-tiered-rate-limits.md)
    - [ADR-0017: Selective Embedding (?include)](./adr/0017-selective-resource-embedding.md)
    - [ADR-0018: HAL-Style Links](./adr/0018-hal-style-links.md)
    - [ADR-0019: Bulk Data Export](./adr/0019-bulk-data-export.md)
    - [ADR-0028: Cache-Control & ETags](./adr/0028-cache-control-etag.md)
  - [Infrastructure & Implementation]()
    - [ADR-0020: Twelve-Factor Design](./adr/0020-twelve-factor-design.md)
    - [ADR-0021: Distroless Containers](./adr/0021-distroless-container-images.md)
    - [ADR-0022: Kubernetes-Native Deployment](./adr/0022-kubernetes-native-deployment.md)
    - [ADR-0023: OpenTelemetry Observability](./adr/0023-opentelemetry-observability.md)
    - [ADR-0024: Immutable Infrastructure](./adr/0024-immutable-infrastructure.md)
    - [ADR-0025: Rust + Axum + SQLx Server](./adr/0025-rust-axum-sqlx-reference-server.md)
    - [ADR-0026: OpenAPI Generator SDKs](./adr/0026-openapi-generator-sdks.md)
    - [ADR-0027: PostgreSQL Full-Text Search](./adr/0027-postgresql-fulltext-search.md)
    - [ADR-0029: Versioned SQL Migrations](./adr/0029-versioned-sql-migrations.md)
    - [ADR-0032: Strangler Fig BGG Migration](./adr/0032-strangler-fig-legacy-migration.md)
  - [Data Model Extensions]()
    - [ADR-0036: Time-Series Snapshots & Trends](./adr/0036-time-series-snapshots-and-trend-analysis.md)
    - [ADR-0038: Alternate Names & Localization](./adr/0038-alternate-names-and-localization.md)
    - [ADR-0039: Extended Game Credits](./adr/0039-extended-game-credits.md)
    - [ADR-0040: Edition Product Metadata](./adr/0040-edition-product-and-physical-metadata.md)
    - [ADR-0041: Community Signals & Stats](./adr/0041-community-signals-and-aggregate-statistics.md)
    - [ADR-0042: Game Awards](./adr/0042-game-awards-and-recognition.md)

# Guides

- [Getting Started](./guides/getting-started.md)
- [Migrating from BGG](./guides/migrating-from-bgg.md)

# Governance

- [Governance Model](./governance.md)
