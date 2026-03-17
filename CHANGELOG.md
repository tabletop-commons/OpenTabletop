# Changelog

All notable changes to the OpenTabletop specification will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- OpenAPI 3.1 specification for core catalog resources (35 schemas, 12 path groups, 8 parameter sets)
- 45 Architecture Decision Records (ADR-0001 through ADR-0045)
- Controlled vocabulary taxonomy: 121 mechanics (phylogenetic tree), 32 categories, 43 themes
- BGG bridge mappings with 5 mapping types (direct, split, merge, subsumed, unmapped)
- Compound filtering system with 9 composable dimensions including expansion-aware effective mode
- Combinatorial expansion property model with three-tier resolution (explicit, computed, fallback)
- Dual playtime model (publisher-stated vs community-reported) with experience-bucketed adjustments (ADR-0034)
- Numeric per-player-count sentiment model (1-5 scale) replacing legacy BGG three-tier polls (ADR-0043)
- Four-layer rating model with confidence scores, distributions, and Dirichlet-prior Bayesian ranking
- Six-dimensional weight model (rules complexity, strategic depth, decision density, cognitive load, fiddliness, game length)
- Community signals: owner count, wishlist count, total plays, ranking data (ADR-0041)
- Bulk data export endpoints (JSON Lines, CSV) with manifest checksums
- Cross-sectional and longitudinal trend analysis endpoints with worked examples
- Statistics roadmap: Parquet export, correlation APIs, recommendation engine foundation, data quality analytics
- Sample data for Spirit Island and Terraforming Mars conforming to the schemas
- Implementer's Guide for SDK generation, server scaffolding, and conformance validation
- mdbook documentation site with mermaid diagrams covering the Three Pillars
- GitHub Actions for spec validation, docs deployment, and ADR format checking

### Changed

- Refocused repository as specification-only commons (ADR-0045) -- the project defines schemas, vocabularies, and sample data, not implementations
- Architecture documentation reframed as implementer guidance rather than descriptions of a specific server
- RFC governance process no longer requires reference implementation updates with spec changes

### Removed

- Reference server scaffold (Rust/Axum/SQLx) -- implementers build their own conforming servers
- Client SDK scaffolds (Rust, Python, JavaScript) -- generate from the OpenAPI spec using standard tooling
- Container build and SDK generation CI workflows
- ADR-0025 (reference server), ADR-0026 (SDK generation), ADR-0031 (RFC requires reference impl) superseded by ADR-0045
