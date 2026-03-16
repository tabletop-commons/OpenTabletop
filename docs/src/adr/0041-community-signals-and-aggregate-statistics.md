---
status: proposed
date: 2026-03-15
---

# ADR-0041: Community Signals and Aggregate Statistics

## Context and Problem Statement

The Game entity lacks several categories of community-generated data that BGG tracks and that publishers and designers rely on for decision-making:

1. **Rating distribution** — BGG shows a 1-10 histogram (e.g., Brass: Birmingham: 379/156/264/336/697/1820/4879/12806/19465/16529). We store only `average_rating` and `rating_count`, losing the distribution shape. A bimodal distribution (love-it-or-hate-it) looks identical to a normal distribution at the same average — publishers need the shape for marketing strategy.

2. **Rankings** — BGG shows overall rank (#1) and category-specific ranks (Strategy #1). We store these in `GameSnapshot` for historical trends but not on the Game entity for current state.

3. **Collection signals** — BGG tracks owners (82,296), wishlists (21,679), trades, and previous owners. These are demand gauges that publishers use for print run planning.

4. **Play activity** — BGG tracks all-time plays (166,001) and monthly plays. The plays-per-owner ratio measures engagement vs "shelf of shame" — valuable for designers evaluating replayability.

5. **Community polls** — Beyond player count polls (which we have), BGG runs suggested age polls and language dependence polls. These help publishers validate age ratings and estimate localization effort.

## Decision Drivers

* Rating distribution shape is a distinct analytical signal from the average — bimodal distributions require different marketing than tight normals
* Rankings are the most-requested data point for casual consumers ("what's #1?")
* Collection signals (owner/wishlist counts) are direct demand metrics for publishers planning print runs
* Language dependence is critical for publishers evaluating localization ROI
* Community suggested age validates or contradicts publisher-stated `min_age`
* `GameSnapshot` already captures `rank_overall`, `rank_by_category`, and `owners_count` at snapshot time — promoting these to live Game fields avoids requiring snapshot queries for current state
* Total plays and engagement metrics help designers evaluate whether their game has replayability

## Considered Options

* **Live fields on Game entity** — Add all aggregate statistics directly to the Game schema
* **Separate Statistics sub-resource** — Create a `/games/{id}/stats` endpoint with its own schema
* **Snapshot-only** — Keep all aggregate data in `GameSnapshot`; query the latest snapshot for current values

## Decision Outcome

Chosen option: "Live fields on Game entity," because these are fundamental game attributes that consumers expect on the primary resource. Requiring a separate request or snapshot query for "what rank is this game?" creates unnecessary friction. The fields are periodically updated (not real-time), consistent with how `weight` and `average_rating` already work on the Game entity.

A separate statistics sub-resource was considered but rejected because it splits core game data across two endpoints. Snapshot-only was rejected because it requires consumers to understand the snapshot system just to get the current rank — an unnecessary abstraction leak.

### Consequences

* Good, because the Game entity becomes a comprehensive representation — rank, distribution, collection signals, and engagement are all available in a single request
* Good, because field naming aligns with `GameSnapshot` (same names, same semantics) — `GameSnapshot` captures history, Game shows current state
* Good, because publishers and designers get actionable metrics without understanding the snapshot system
* Bad, because the Game entity grows from ~29 to ~40 properties — implementations may want to distinguish "summary" vs "detail" field sets
* Bad, because aggregate statistics are stale the moment they're computed — the spec should document refresh expectations
* Bad, because `GameSnapshot.owners_count` must be renamed to `owner_count` for consistency with the Game entity convention

## Implementation

### Game Schema Changes

Add these fields to `spec/schemas/Game.yaml`:

**Rating distribution:**
- `rating_distribution` (integer[10]) — Histogram of votes per rating bucket (index 0 = count of 1-star, index 9 = count of 10-star)
- `rating_stddev` (float) — Standard deviation of the rating distribution

**Rankings:**
- `rank_overall` (integer, nullable) — Current overall ranking position
- `rank_by_category` (map of category slug → rank, nullable) — Per-category rankings

**Collection signals:**
- `owner_count` (integer, nullable) — Users who own this game
- `wishlist_count` (integer, nullable) — Users who have wishlisted this game

**Play activity:**
- `total_plays` (integer, nullable) — All-time logged play count

**Community polls:**
- `community_suggested_age` (integer, nullable) — Community-polled minimum age
- `language_dependence` (enum, nullable) — `no_text`, `some_text`, `moderate_text`, `extensive_text`, `unplayable_without_text`

### New Poll Schemas

Following the `PlayerCountPoll` pattern:

**`spec/schemas/CommunityAgePoll.yaml`** — Per-age vote counts:
- `game_id` (UUID, required)
- `suggested_age` (integer, required)
- `vote_count` (integer, required)

**`spec/schemas/LanguageDependencePoll.yaml`** — Per-level vote counts:
- `game_id` (UUID, required)
- `level` (enum, required): `no_text`, `some_text`, `moderate_text`, `extensive_text`, `unplayable_without_text`
- `vote_count` (integer, required)

### New Endpoint

**`GET /games/{id}/polls`** — Returns all community poll data (player count, age, language dependence). Add `polls` to the `include` parameter.

### GameSnapshot Alignment

Rename `GameSnapshot.owners_count` to `owner_count` for consistency with `rating_count`, `weight_votes`, and the new Game entity field.

### BGG Migration Mapping

| BGG Field | OpenTabletop Field |
|-----------|-------------------|
| Rating histogram (1-10) | `rating_distribution` |
| Std. Deviation | `rating_stddev` |
| Overall Rank | `rank_overall` |
| Category-specific Rank | `rank_by_category` |
| Owned | `owner_count` |
| Wishlist | `wishlist_count` |
| All Time Plays | `total_plays` |
| Suggested Player Age poll | `CommunityAgePoll` + `community_suggested_age` |
| Language Dependence poll | `LanguageDependencePoll` + `language_dependence` |
