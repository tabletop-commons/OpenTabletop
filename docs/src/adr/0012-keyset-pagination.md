---
status: accepted
date: 2026-03-12
---

# ADR-0012: Keyset (Cursor-Based) Pagination

## Context and Problem Statement

The OpenTabletop API serves collections that can contain tens of thousands of games. Pagination is essential, but the choice of pagination strategy has significant implications for performance, consistency, and usability. We need a pagination approach that performs consistently regardless of collection size and handles concurrent data changes gracefully.

## Decision Drivers

* Performance must not degrade as the user pages deeper into results (page 1000 should be as fast as page 1)
* Results must be consistent even when new records are inserted during pagination
* Pagination tokens should be opaque to discourage clients from constructing or manipulating them
* The approach must work efficiently with PostgreSQL's query planner

## Considered Options

* Offset-based pagination (OFFSET/LIMIT)
* Keyset/cursor-based pagination
* Page-number pagination (page=N&per_page=M)

## Decision Outcome

Chosen option: "Keyset/cursor-based pagination", because it provides O(1) consistent performance regardless of how deep into the result set the user has paged. The API returns `next_cursor` and `prev_cursor` as opaque Base64-encoded tokens in the response metadata. Clients pass these as query parameters to fetch the next or previous page. The default page size is 25, the maximum is 100, configurable via the `limit` parameter. Offset-based pagination was rejected because `OFFSET N` requires scanning and discarding N rows, causing linear performance degradation on deep pages. Page-number pagination was rejected for the same underlying performance issue since it is functionally equivalent to offset pagination.

### Consequences

* Good, because query performance is constant regardless of page depth
* Good, because keyset pagination is immune to phantom reads (inserted/deleted rows don't shift pages)
* Good, because opaque cursors decouple the client from the underlying sort implementation
* Bad, because clients cannot jump to an arbitrary page (e.g., "page 50 of 200") without sequential traversal
* Bad, because changing the sort order invalidates existing cursors, requiring clients to restart pagination
