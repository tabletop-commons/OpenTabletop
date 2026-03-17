---
status: accepted
date: 2026-03-12
---

# ADR-0025: Rust with Axum and SQLx for the Reference Server

## Context and Problem Statement

The OpenTabletop specification needs a reference server implementation that demonstrates the full API contract, serves as a conformance test target, and can be deployed in production. The technology choice for this reference server must prioritize correctness, performance, and long-term maintainability. Critically, the reference server is one valid implementation of the specification -- not the only one -- and should not be conflated with the spec itself.

## Decision Drivers

* The reference server must faithfully implement the full OpenAPI specification
* Type safety and compile-time guarantees reduce runtime bugs in a specification-critical codebase
* Performance should be excellent out of the box without extensive tuning
* The SQL layer should be checked at compile time to catch query errors before deployment
* The technology should have a strong, growing ecosystem and community

## Considered Options

* actix-web with Diesel ORM
* Axum with SQLx (compile-time checked queries)
* Rocket with SeaORM

## Decision Outcome

Chosen option: "Axum with SQLx and PostgreSQL", because Axum's macro-free, tower-based architecture provides excellent composability and testability while SQLx's compile-time SQL checking catches query errors at build time rather than runtime. Axum is built on tokio and tower, making it fully interoperable with the broader async Rust ecosystem without custom runtime requirements. SQLx's `query!` and `query_as!` macros verify SQL syntax and type compatibility against the actual database schema during compilation, which is invaluable for a reference implementation that must be correct. PostgreSQL is the database (see ADR-0027) for its full-text search and JSONB capabilities. actix-web was rejected because its macro-heavy API and custom runtime add unnecessary coupling. Rocket was rejected because its compile-time checking is less mature than SQLx's.

### Consequences

* Good, because compile-time SQL verification eliminates an entire class of runtime query errors
* Good, because Axum's tower-based middleware is composable, testable, and interoperable with the async Rust ecosystem
* Good, because Rust's performance characteristics mean the reference server can also serve as a production server
* Bad, because Rust's learning curve is steeper than languages like Python or Go, potentially limiting contributor diversity
* Bad, because compile-time SQL checking requires a running database during the build process (mitigated by SQLx's offline mode)
