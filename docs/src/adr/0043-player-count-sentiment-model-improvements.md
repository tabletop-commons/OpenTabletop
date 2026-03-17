---
status: proposed
date: 2026-03-16
---

# ADR-0043: Player Count Sentiment Model Improvements

## Context and Problem Statement

The current PlayerCountPoll model ([ADR-0010](0010-structured-player-count-polls.md)) uses BGG's three-tier voting system: for each player count, voters choose one of Best, Recommended, or Not Recommended. This system was adopted for BGG migration compatibility, but it has fundamental statistical flaws that the commons group should address as the specification matures.

### Known Flaws in the Three-Tier Model

**1. Overlapping categories.** "Best" is conceptually a subset of "Recommended" -- if a player count is the best, it is by definition recommended. But the poll treats them as mutually exclusive choices. A voter who considers 3-player the best experience cannot simultaneously mark it as recommended. The categories answer different questions ("Is this the ideal count?" vs "Is this count good?") but force a single answer.

**2. Missing middle ground.** There is no option between "Recommended" and "Not Recommended." A player count that is playable but mediocre -- works fine, wouldn't seek it out -- has no natural home. Voters are forced to round up to "Recommended" or round down to "Not Recommended," inflating or deflating the signal.

**3. Anchoring bias.** The boundary between "Best" and "Recommended" is entirely subjective and varies per voter. One voter's "Best" is another's "Recommended." There is no calibration mechanism -- unlike the weight scale (which has anchor games), the poll categories have no reference points.

**4. Forced ranking.** A voter who thinks 3-player and 4-player are equally excellent must choose "Best" for one and "Recommended" for the other. The model cannot express ties at the top. This creates artificial differentiation where none exists in the voter's actual opinion.

**5. Non-independence across player counts.** A voter's responses at different player counts are not independent decisions. Voters mentally rank all player counts, then map that ranking onto three buckets. The three-tier model treats each player count as an independent poll, but the data-generating process is inherently comparative.

**6. Aggregation artifacts.** A game where 80% of voters say "Best at 3" and a different 80% say "Best at 4" appears to have two equally "best" counts. But no individual voter may actually consider both counts equally best -- the aggregate masks disagreement. Without per-voter data, the source of the pattern is unrecoverable.

## Decision Drivers

* BGG migration requires preserving three-tier data for the foreseeable future -- any improvement must be backward-compatible
* Statistical soundness: the replacement model should produce data amenable to standard statistical analysis (means, medians, distributions)
* UI simplicity: the voting interface must be intuitive for casual users, not just statisticians
* Community adoption: the model must be easy to contribute to -- a complex system that nobody uses is worse than a flawed one with millions of votes
* The 33+ files across the specification that reference the current model represent significant refactoring cost for any structural change

## Considered Options

### Option A: Numeric Rating Per Player Count (1-5 Scale)

Each voter independently rates each supported player count on a 1-5 scale:

| Player Count | Your Rating |
|-------------|------------|
| 1 | 2 / 5 |
| 2 | 4 / 5 |
| 3 | 5 / 5 |
| 4 | 5 / 5 |
| 5 | 3 / 5 |

**Strengths:**
- Produces real numeric distributions (mean, median, std dev, percentiles) per player count
- A voter CAN rate 3p and 4p both 5/5 -- no forced ranking
- Aligns with how BGG already handles overall game ratings (the 1-10 scale)
- Independent per player count -- no cross-count comparison forced
- Standard statistical tools apply directly

**Weaknesses:**
- Requires a new UI paradigm (5-point scale per count vs single radio button)
- Not backward-compatible with existing BGG three-tier data
- Scale calibration: what does "3 out of 5" mean? Needs anchor definitions.

### Option B: Pairwise Preference / Ranked Choice

Voters rank all supported player counts from best to worst. Aggregation uses a Condorcet method, Borda count, or similar social choice function.

**Strengths:**
- Most statistically rigorous -- captures full preference ordering
- No category overlap or forced bucketing
- Well-studied aggregation methods from voting theory

**Weaknesses:**
- Complex to aggregate and explain to users
- Difficult UI for games with wide player ranges (ranking 1-8 is tedious)
- Unfamiliar paradigm -- most users have never seen ranked-choice voting for board game data
- No established board game community uses this approach

### Option C: Binary Per Count (Would Play / Would Not Play)

For each player count, a single yes/no question: "Would you play this game at this player count?"

**Strengths:**
- Simplest possible signal -- no ambiguity, no overlap
- Eliminates the Best/Recommended boundary problem entirely
- Easy to aggregate: percentage of "yes" votes per count

**Weaknesses:**
- Loses all granularity between "great" and "fine"
- Cannot distinguish "best at 3" from "acceptable at 3"
- The filtering use case ("best at exactly 3") becomes impossible

### Option D: Dual-Layer Model

Maintain two parallel data layers:

- **Layer 1 (BGG compatibility):** The existing three-tier votes (best/recommended/not_recommended). Populated during BGG migration and by voters who prefer the familiar interface.
- **Layer 2 (native):** A numeric 1-5 rating per player count. The statistically preferred data source for new contributions.

Filtering uses Layer 2 when sufficient data exists, falling back to Layer 1. Over time, as native contributions accumulate, Layer 2 becomes the authoritative source.

**Strengths:**
- Full backward compatibility -- no existing data is lost or invalidated
- Gradual migration path -- both layers coexist indefinitely
- Layer 2 produces proper statistical distributions while Layer 1 serves migration needs

**Weaknesses:**
- Two parallel systems increase complexity for implementations and API consumers
- Unclear when to declare Layer 2 "sufficient" and deprioritize Layer 1
- Voters may be confused by two different rating interfaces

## Decision Outcome

Chosen option: "Dual-layer model" (Option D), adopting **numeric per-count ratings as the native model** with BGG three-tier data preserved as a legacy migration layer.

The specification defines `PlayerCountRating` as the primary schema: each voter independently rates each supported player count on a 1-5 scale, producing standard statistical distributions (mean, std dev) per count. The BGG three-tier data (Best/Recommended/Not Recommended) is preserved as `PlayerCountPollLegacy` for migration compatibility ([ADR-0032](0032-strangler-fig-legacy-migration.md)). Filtering and derived fields use the numeric model when available, falling back to converted legacy data.

Numeric per-count ratings were chosen over ranked choice (Option B, too complex for voters) and binary would-play (Option C, loses granularity). The pure numeric approach (Option A) is effectively what the dual-layer model implements as its native layer -- Option D simply adds the legacy compatibility that migration requires.

### Consequences

* Good, because the native model uses standard numeric data amenable to means, medians, percentiles, and confidence intervals
* Good, because voters can rate multiple player counts equally -- no forced ranking, no overlapping categories
* Good, because BGG migration data is preserved without loss -- the legacy schema stores the original three-tier votes
* Good, because the specification transparently acknowledges the limitations of the inherited model
* Good, because implementations can convert legacy three-tier data to approximate numeric values for unified querying
* Bad, because two parallel schemas (native + legacy) increase complexity for implementations
* Bad, because the numeric scale lacks anchor definitions (unlike the weight scale) -- a future RFC should define what 1-5 means for player count quality
* Bad, because applications built against the old three-tier `PlayerCountPoll` schema will need to update to `PlayerCountRating`
