---
status: accepted
date: 2026-03-12
---

# ADR-0016: API Key Authentication with Tiered Rate Limits

## Context and Problem Statement

The OpenTabletop API must balance open access for reading public data with protection against abuse and accountability for write operations. The authentication and rate-limiting strategy must be simple enough that hobbyist developers can start using the API immediately while providing enough control to prevent abuse and track usage patterns.

## Decision Drivers

* Reading public game data should have the lowest possible barrier to entry
* Write operations (data contributions, corrections) require accountability
* Rate limiting must prevent abuse without blocking legitimate use
* The solution must be simple to implement and understand -- no OAuth flows for basic usage

## Considered Options

* No authentication -- fully open with IP-based rate limiting only
* API key required for all access
* Tiered access -- public reads with IP rate limiting, authenticated reads and writes with API key

## Decision Outcome

Chosen option: "Tiered access with API key authentication", because it minimizes friction for data consumers while maintaining accountability for data contributors. The three tiers are: (1) Public tier -- no authentication required, IP-based rate limiting at 60 requests per minute, read-only access; (2) Authenticated tier -- API key via `X-API-Key` header, 600 requests per minute, read-only access; (3) Write tier -- API key required, write operations for data contributions and corrections. API keys are free and self-service via the developer portal. OAuth 2.0 is documented as a future enhancement for user-delegated access scenarios. Full-open was rejected because write operations need accountability. API-key-for-all was rejected because it raises the barrier for simple read-only consumers.

### Consequences

* Good, because hobbyist developers can start querying the API immediately with zero signup
* Good, because the 10x rate limit increase for authenticated users incentivizes key registration
* Good, because API keys enable per-consumer usage tracking and abuse detection
* Bad, because IP-based rate limiting for the public tier can affect users behind shared NAT/proxies
* Bad, because API keys alone do not support user-delegated access patterns (addressed by future OAuth 2.0)
