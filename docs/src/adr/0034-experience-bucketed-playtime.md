---
status: proposed
date: 2026-03-13
---

# ADR-0034: Experience-Bucketed Playtime Adjustment

## Context and Problem Statement

Publisher-stated and community-reported play times (ADR-0014) implicitly assume experienced players. First-time players typically take 40-60% longer -- box times are set by designers and playtesters who have played the game hundreds of times. When filtering by playtime for game night ("we have 90 minutes"), the system should account for whether the group knows the game or is learning it for the first time. No existing board game API or app models experience-adjusted time predictions.

Setup and teardown time is also systematically excluded from publisher estimates. A game like *Spirit Island* may claim 90-120 minutes, but a first-time group will spend 20 minutes on setup alone, then 150+ minutes playing, because every card requires reading, every decision tree is unfamiliar, and rules questions interrupt flow.

## Decision Drivers

* First plays take ~50% longer than experienced plays; this is systematic, not random
* The existing dual playtime model (ADR-0014) does not distinguish experience levels
* Filtering by "time I actually have" requires knowing the group's familiarity with the game
* Data must be community-contributed, following the Pillar 3 philosophy of raw distributions
* Must compose with existing 6-dimensional filtering (ADR-0013) without adding a new dimension
* Must work with effective mode and expansion combinations (ADR-0007)
* Different games have different experience curves -- a party game has near-zero first-play penalty while a heavy euro may have a 2× penalty

## Considered Options

* **Full per-player-count × per-experience-level matrix** -- Store times for every (player_count, experience_level) cell
* **Hardcoded multipliers per game** -- Store a single set of fixed multipliers
* **Experience-level poll data with derived multipliers** -- Community-reported playtime bucketed by experience level, with multipliers derived from the raw data

## Decision Outcome

Chosen option: "Experience-level poll data with derived multipliers," because it follows the project's established pattern of storing raw community distributions (Pillar 3, like PlayerCountPoll in ADR-0010) while deriving practical filtering values. Four experience levels are defined:

| Level | Description | Typical Multiplier |
|-------|-------------|-------------------|
| `first_play` | Everyone is new to the game | ~1.5× |
| `learning` | 1-3 prior plays, still referencing rules | ~1.25× |
| `experienced` | 4+ plays, knows the rules well (baseline) | 1.0× |
| `expert` | Optimized play, minimal downtime | ~0.85× |

Community play logs include a self-reported experience level. The system aggregates these into per-level median and percentile times. Multipliers are derived as ratios relative to the `experienced` baseline: `multiplier[level] = median[level] / median[experienced]`.

Games without sufficient experience data fall back to global default multipliers derived from aggregate data across all games.

### Consequences

* Good, because consumers can filter by actual available time for their group's experience level
* Good, because raw poll data supports future statistical analysis (Pillar 3)
* Good, because the experience parameter is a modifier on existing playtime filtering, not a new filter dimension -- it composes naturally with `playtime_source` and `effective=true`
* Good, because game-specific multipliers capture the reality that different games have different experience curves
* Good, because global default multipliers ensure the feature works even for games without experience-specific data
* Bad, because play log contributions must now include an experience level field, adding friction to data entry
* Bad, because games with few play reports will have unreliable experience-level breakdowns (mitigated by `sufficient_data` flag and global fallbacks)

### Rejected Options

The **full matrix** was rejected because it requires community data for every cell (player_count × experience_level), and most cells would have too few data points to be statistically meaningful. The per-player-count breakdown already exists independently in the community playtime statistics data.

**Hardcoded multipliers** were rejected because different games have fundamentally different experience curves: a party game like *Codenames* has almost no first-play penalty (the rules take 2 minutes to explain), while a heavy game like *Through the Ages* may have a 2× first-play penalty. Game-specific community data is essential for accuracy.

## Implementation

### New Schemas

- `ExperiencePlaytimePoll` -- Per-level community-reported playtime data (median, p10, p90, report count)
- `ExperiencePlaytimeProfile` -- Aggregate profile with all four levels and derived multipliers

### API Changes

- New endpoint: `GET /games/{id}/experience-playtime` -- returns the full experience profile
- New query parameter: `playtime_experience` -- adjusts playtime filtering for a given experience level
- New POST filter field: `playtime.experience` in `SearchRequest`
- New include value: `experience_playtime` for embedding in game responses

### Filter Composition

The experience parameter modifies Dimension 2 (Play Time) without creating a new dimension:

```
source selection → expansion resolution → experience adjustment → comparison
```

When `playtime_experience=first_play` and `playtime_max=120`:
1. Select the playtime source (publisher or community)
2. Resolve effective playtime if `effective=true` (ADR-0007)
3. Apply the first_play multiplier to the game's playtime
4. Compare the adjusted value against 120 minutes
