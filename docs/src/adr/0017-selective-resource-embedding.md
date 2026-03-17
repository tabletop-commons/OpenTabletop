---
status: accepted
date: 2026-03-12
---

# ADR-0017: Selective Resource Embedding via ?include Parameter

## Context and Problem Statement

Game resources have many related entities -- mechanics, designers, publishers, expansions, player count polls, and more. Always embedding all related data in every response wastes bandwidth and increases latency. Never embedding forces clients into N+1 request patterns. We need a middle ground that lets clients request exactly the related resources they need in a single request.

## Decision Drivers

* Clients have varying needs -- a list view needs minimal data, a detail view needs rich data
* Over-fetching wastes bandwidth, especially on mobile connections
* Under-fetching forces N+1 request patterns that increase latency
* The mechanism should be simple and self-documenting via OpenAPI

## Considered Options

* Always embed all related resources in every response
* Never embed -- clients must make separate requests for each related resource
* Selective embedding via `?include` query parameter

## Decision Outcome

Chosen option: "Selective embedding via ?include parameter", because it gives clients precise control over response payload size while enabling single-request access to related resources. The `?include` parameter accepts a comma-separated list of relationship names (e.g., `?include=mechanics,designers,expansions`). When specified, the related resources are embedded in the response under their respective keys. When omitted, only the core game fields and `_links` (see ADR-0018) are returned. The set of valid include values is documented per endpoint in the OpenAPI spec. Always-embed was rejected because it makes list endpoints prohibitively expensive. Never-embed was rejected because it forces clients into inefficient multi-request patterns.

### Consequences

* Good, because clients fetch exactly the data they need in a single request
* Good, because list endpoints remain lightweight by default
* Good, because the valid include values are self-documenting in the OpenAPI spec
* Bad, because the server must handle dynamic JOIN/query generation based on the include parameter
* Bad, because deeply nested includes (e.g., expansions of expansions) require depth limits to prevent performance issues
