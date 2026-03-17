---
status: accepted
date: 2026-03-12
---

# ADR-0002: Use REST with OpenAPI 3.2 as the API Protocol

## Context and Problem Statement

The OpenTabletop project defines a public specification for board game data interchange. We need to choose an API protocol and contract format that maximizes adoption across diverse consumers -- web frontends, mobile apps, data science pipelines, and third-party integrations. The specification must serve as the single source of truth, and the design process must be spec-first so that implementations conform to the spec rather than the other way around.

## Decision Drivers

* Broadest possible client compatibility across languages and platforms
* Machine-readable specification that can generate documentation, SDKs, and validation
* Spec-first design workflow where the OpenAPI document is authored before implementation
* Low barrier to entry for hobbyist and community developers

## Considered Options

* REST with OpenAPI 3.2 specification
* GraphQL with schema-first SDL
* gRPC with Protocol Buffers

## Decision Outcome

Chosen option: "REST with OpenAPI 3.2", because REST has the broadest compatibility across every HTTP client in every language with zero special tooling required. OpenAPI 3.2 is the industry standard for describing REST APIs, enabling automatic SDK generation, interactive documentation, and contract testing. GraphQL adds query flexibility but introduces complexity around caching, authorization per field, and requires specialized clients. gRPC excels at service-to-service communication but is poorly suited for browser-based consumers and public APIs. The OpenAPI specification document is the canonical source of truth; implementations are validated against it.

### Consequences

* Good, because any HTTP client can consume the API without specialized libraries
* Good, because OpenAPI enables automatic SDK generation, documentation, and mock servers
* Good, because spec-first design ensures the contract is stable and well-defined before coding begins
* Bad, because REST requires multiple round-trips for related resources where GraphQL could fetch in one request (mitigated by selective embedding via ?include parameter)
* Bad, because OpenAPI 3.2 is newer and some tooling may lag behind 3.0/3.1 support
