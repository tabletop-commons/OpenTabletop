---
status: accepted
date: 2026-03-12
---

# ADR-0014: Dual Playtime Model -- Publisher-Stated and Community-Reported

## Context and Problem Statement

Board game play times as stated by publishers (printed on the box) are notoriously inaccurate -- they often represent ideal conditions and experienced players. Community-reported play times from actual play logs are typically more reliable but are not always available, especially for new or niche games. The API needs to represent both sources of playtime data and make intelligent defaults for filtering.

## Decision Drivers

* Publisher-stated playtimes are universally available but often inaccurate
* Community-reported playtimes are more accurate but require sufficient play log data
* Consumers should be able to distinguish between the two sources
* Filtering should default to the most accurate available data

## Considered Options

* Publisher-stated playtime only
* Community-reported playtime only
* Both publisher-stated and community-reported, with smart defaulting

## Decision Outcome

Chosen option: "Both publisher-stated and community-reported playtimes", because each serves a different purpose and both have value. The game entity includes `publisher_playtime_min` and `publisher_playtime_max` (from the box) as well as `community_playtime_min`, `community_playtime_max`, and `community_playtime_median` (from aggregated play logs). When filtering by playtime, the API defaults to community-reported values when sufficient data exists (minimum vote threshold) and falls back to publisher-stated values otherwise. The response includes a `playtime_source` field indicating which source was used. Publisher-only was rejected because the data is too unreliable for accurate filtering. Community-only was rejected because new games would have no playtime data at all.

### Consequences

* Good, because consumers get the most accurate playtime data available for each game
* Good, because the `playtime_source` field provides transparency about data provenance
* Good, because publisher playtimes serve as a universal fallback ensuring every game has some playtime data
* Bad, because maintaining two parallel playtime datasets increases storage and complexity
* Bad, because the threshold for "sufficient community data" is a tunable parameter that affects filtering results
