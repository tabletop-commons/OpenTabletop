---
status: accepted
date: 2026-03-12
---

# ADR-0028: Cache-Control Headers and ETags

## Context and Problem Statement

Board game metadata changes infrequently — a game's mechanics, player count, and description rarely update after initial entry. The API should leverage HTTP caching to reduce server load, decrease response latency for repeat requests, and enable CDN integration. We need a caching strategy that matches the data's update frequency while ensuring clients eventually receive fresh data.

## Decision Drivers

* Game metadata is read-heavy and write-rare, making it an ideal caching candidate
* Dynamic data (e.g., community playtime polls, ratings) changes more frequently and needs shorter cache windows
* CDN and browser caches should be leverageable without custom integration
* Clients must have a mechanism to validate cached data without re-downloading (conditional requests)

## Considered Options

* No caching — every request hits the origin server
* Server-side caching only (Redis/Memcached) with no client-side cache hints
* HTTP cache headers (Cache-Control and ETag) for client and CDN caching

## Decision Outcome

Chosen option: "HTTP Cache-Control headers and ETags", because they leverage the entire HTTP caching infrastructure (browsers, CDNs, reverse proxies) without any custom client-side logic. Game metadata responses include `Cache-Control: public, max-age=86400` (24 hours) since this data changes rarely. Dynamic data (poll results, community playtimes) uses `Cache-Control: public, max-age=300` (5 minutes). All responses include an `ETag` header (based on content hash) enabling conditional requests via `If-None-Match` — the server returns 304 Not Modified when the content has not changed, saving bandwidth. No-caching was rejected because it wastes resources on a read-heavy, write-rare dataset. Server-side-only caching was rejected because it misses the opportunity to eliminate requests entirely via client and CDN caches.

### Consequences

* Good, because CDNs can cache responses at edge locations, reducing latency globally
* Good, because ETags enable conditional requests, saving bandwidth when data has not changed
* Good, because standard HTTP caching requires no custom client implementation
* Bad, because stale cache entries may serve outdated data for up to the max-age duration
* Bad, because cache invalidation on data updates requires careful consideration of cache-busting strategies
