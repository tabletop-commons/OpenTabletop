# Changelog

All notable changes to the OpenTabletop specification and reference implementations will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial OpenAPI 3.1 specification for core catalog resources
- 33 Architecture Decision Records (ADRs) covering all foundational decisions
- mdbook documentation with mermaid diagrams covering the Three Pillars
- Compound filtering/windowing system with 6 composable dimensions
- Combinatorial expansion property model with `ExpansionCombination` entity
- Dual play-time model (publisher-stated vs community-reported)
- Structured player count polls (best/recommended/not-recommended per count)
- Bulk data export endpoints (JSON Lines, CSV)
- Reference server scaffold (Rust/Axum/SQLx)
- SDK scaffolds for Rust, Python, JavaScript/TypeScript
- Claude skills for ADR management and OpenAPI component generation
- GitHub Actions workflows for spec validation, docs deployment, SDK generation
- Cloud-native deployment configuration (Dockerfile, Kubernetes manifests, docker-compose)
