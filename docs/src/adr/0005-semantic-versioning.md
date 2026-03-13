---
status: accepted
date: 2026-03-12
---

# ADR-0005: Semantic Versioning for Spec and Implementations

## Context and Problem Statement

The OpenTabletop project has multiple versioned artifacts: the API specification, the reference server, and generated SDKs. Consumers need to understand at a glance whether an update is safe to adopt or contains breaking changes. We need a versioning scheme that communicates compatibility clearly and works across the specification and its implementations.

## Decision Drivers

* Breaking changes to the API spec must be immediately obvious to implementers
* SDKs and the reference server version independently but must clearly state which spec version they support
* The versioning scheme must be widely understood and tooling-friendly
* Pre-release and build metadata should be supported for development workflows

## Considered Options

* CalVer (calendar versioning, e.g., 2026.03)
* SemVer (semantic versioning, MAJOR.MINOR.PATCH)
* Custom versioning scheme

## Decision Outcome

Chosen option: "SemVer", because it is the most widely understood versioning scheme and directly communicates the impact of each release. For the API specification: a MAJOR bump means breaking changes to the API contract, MINOR means additive non-breaking changes (new endpoints, new optional fields), and PATCH means documentation fixes or clarifications with no behavioral change. SDKs and the reference server version independently using their own SemVer numbers but declare their compatible spec version in metadata (e.g., `spec-compatibility: 1.2.x`). CalVer was rejected because it does not communicate compatibility information.

### Consequences

* Good, because consumers can immediately assess upgrade risk from the version number
* Good, because SemVer is universally understood and supported by every package manager
* Good, because independent SDK versioning allows bug fixes without waiting for spec releases
* Bad, because maintaining the spec-compatibility mapping across multiple SDKs requires discipline
* Bad, because SemVer's "breaking change = major bump" can lead to high major version numbers if the spec evolves rapidly in early stages
