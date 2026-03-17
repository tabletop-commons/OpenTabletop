# Rating Model

Game ratings are the most visible number in any board game database -- and the most misunderstood. A rating of 8.3 does not mean a game is objectively "8.3 out of 10 good." It means a self-selected population of voters produced that average. The OpenTabletop specification stores ratings as raw distributional data, exposing the inputs rather than a single opaque output.

## How OpenTabletop Stores Ratings

The [Game entity](./games.md) carries these rating fields:

| Field | Type | Description |
|-------|------|-------------|
| `average_rating` | float (0-10) | Arithmetic mean of all user ratings |
| `bayes_rating` | float (0-10) | Bayesian average that regresses toward the global mean |
| `rating_count` | integer | Total number of user ratings |
| `rating_distribution` | integer[10] | Histogram: count of votes at each 1-10 bucket ([ADR-0041](../../adr/0041-community-signals-and-aggregate-statistics.md)) |
| `rating_stddev` | float | Standard deviation of the distribution |

The `average_rating` and `rating_count` are the source data. The `bayes_rating` is a derived value that implementations may compute using their own parameters. The `rating_distribution` histogram exposes the full shape of voter opinion.

## BGG's Bayesian Average ("Geek Rating")

BoardGameGeek computes its rankings using a [Bayesian average](https://blog.recommend.games/posts/reverse-engineering-boardgamegeek-ranking/). BGG has never published the exact formula, but reverse-engineering analysis estimates it adds approximately **1,500 dummy votes each rated at 5.5** (the midpoint of the 1-10 scale) to every game's actual votes:

```
geek_rating = (sum_of_real_ratings + 1500 × 5.5) / (real_vote_count + 1500)
```

**Purpose:** This prevents a game with two 10/10 ratings from outranking a game with 50,000 votes averaging 8.5. By pulling all games toward 5.5, the formula requires a large number of high ratings to climb the rankings.

**Example:** A game with 100 real votes averaging 9.0 gets a geek rating of ~5.72 (still pulled heavily toward 5.5). A game with 50,000 real votes averaging 8.5 gets a geek rating of ~8.41 (barely affected by the dummy votes). The dummy votes wash out as real votes accumulate.

## Known Problems with the BGG Rating Model

### 1. Secret, Non-Reproducible Algorithm

The exact number of dummy votes, their value, and the definition of "regular voter" are not public. [Reverse-engineering efforts](https://blog.recommend.games/posts/reverse-engineering-boardgamegeek-ranking/) estimate ~1,500 dummy votes at ~5.5 (with best-fit values ranging from 5.494 to 5.554 depending on methodology), but BGG has never confirmed any parameter, and they may change over time. A specification built on a secret algorithm is not a specification -- it's a black box.

### 2. Opaque Vote Scrubbing

BGG removes ratings it considers suspicious -- likely from new accounts, inactive accounts, or patterns suggesting manipulation. The criteria are unpublished, which means the same raw data can produce different rankings depending on which votes BGG decides to include. This is understandable as an anti-manipulation measure but makes the ranking non-deterministic from an outside observer's perspective.

### 3. Dummy Votes Don't Distinguish New from Niche

A game with 50 votes might be new (and will accumulate more) or niche (and 50 votes is its steady state). The Bayesian average penalizes both equally. A niche wargame beloved by its small community and a recently-released party game both get pulled toward 5.5, but for entirely different reasons. The formula cannot distinguish these cases.

### 4. Inconsistent Scale Usage

The 1-10 scale is used inconsistently across voters:
- Some voters use the full range (1-10). Others effectively rate on a 5-10 scale, never rating below 5.
- Some voters use a 1-5 mental scale mapped onto BGG's 1-10 range -- their "5 out of 5" game gets a 5, not a 10. This makes them appear to rate everything extremely low compared to voters using the full range. A voter whose highest rating is a 5 and another whose lowest is a 6 are using incompatible scales, but their votes are averaged together as if they weren't.
- Some voters only rate games they own (biasing upward). Others rate games they disliked and traded away.
- Some voters treat ratings as a personal ranking tool (their #1 game gets a 10, their #50 gets a 6). Others treat the scale as absolute.
- The result: a "7" from one voter is not comparable to a "7" from another. There is no calibration mechanism -- BGG does not normalize ratings across voters or detect incompatible scale usage.

### 5. Complexity Bias

[Dinesh Vatvani's analysis](https://dvatvani.github.io/BGG-Analysis-Part-2.html) demonstrates a significant correlation between game complexity (weight) and BGG rating. The heaviest games on BGG average roughly **2.5 points higher** than the lightest games (regression slope ~0.63 on the 1-5 weight scale mapped to the 1-10 rating scale). This is not because complex games are objectively better -- it's because BGG's voter population disproportionately values complexity. See [Weight Model](./weight-model.md) for deeper analysis.

### 6. Self-Selection Bias

Only people who care enough to rate games on BoardGameGeek -- whether through the website, the BGG app, or third-party apps that sync plays and ratings back to BGG -- are represented. This population skews toward experienced hobbyist gamers who prefer medium-to-heavy strategy games and are engaged enough in the hobby to track their plays and maintain ratings. Casual gamers, families, and non-English-speaking communities are underrepresented. The BGG top 100 is a popularity contest within a specific demographic, not a universal quality ranking.

OpenTabletop addresses this structurally: because the specification is language-agnostic and designed for multiple independent implementations, a Japanese board game community, a German community, or a Brazilian community can each run conforming servers with their own voting populations. Ratings from these communities reflect *their* preferences, not BGG's English-speaking demographic. The same API contract serves all of them, and applications can query across communities or within a specific one. See [Data Provenance & Bias](./data-provenance.md).

## OpenTabletop's Approach

### Input Contract

The rating model follows the specification's [Input Contract](./data-provenance.md#input-contract) principles:

| Element | Rating-Specific Definition |
|---------|---------------------------|
| **Question** | "Rate your overall experience with *[Game]*" |
| **Scale** | 1-10, with voter-declared scale preference supported (see Layer 1 below). Anchors: 1 = "terrible, would never play again", 5 = "mediocre, take it or leave it", 10 = "outstanding, a top game for me" |
| **Context captured** | Declared scale preference (e.g., "I use 1-5"), number of plays of this game, experience level |
| **Transparency** | "Your 4/5 is recorded as 8/10 on the canonical scale because you declared a 1-5 preference" |

### The Four-Layer Model

OpenTabletop uses a four-layer model that addresses the fundamental problems with BGG's approach:

#### Layer 1: Voter-Declared Scale

The specification captures each voter's **personal scale preference** as metadata at vote time. A voter can declare "I rate on a 1-5 scale" or "I rate on a 1-10 scale" or "I only use the 5-10 range." This declaration is the normalization key: a voter whose declared max is 5 has their 5 mapped to 10 on the canonical 1-10 scale.

This eliminates the "1-5 voter looks like they hate everything" problem at the source rather than trying to correct for it statistically. It also makes the normalization transparent to the voter ("your 4/5 is recorded as 8/10 on the canonical scale").

Where declared scale data is unavailable (e.g., legacy BGG imports), implementations may fall back to statistical inference (see [Item Response Theory](#item-response-theory-irt) below), but the spec's native path is explicit declaration.

#### Layer 2: Raw Normalized Data

All aggregate statistics are computed from votes normalized to the canonical 1-10 scale:

- **`average_rating`** -- Arithmetic mean of normalized votes. No dummy votes, no scrubbing, no secret formula.
- **`rating_count`** -- Sample size. Consumers assess reliability themselves.
- **`rating_distribution`** -- Full 1-10 histogram revealing distribution shape:
  - Tight bell curve around 7-8 = broad consensus.
  - Bimodal (peaks at 4 and 9) = polarizing game.
  - Left-skewed = most like it, a few hate it.
  - The shape tells a richer story than any average.
- **`rating_stddev`** -- Standard deviation quantifying voter agreement (0.8 = tight consensus, 2.5 = wild disagreement).

#### Layer 3: Confidence Score

A **spec-defined** confidence metric (0.0 to 1.0) that answers: "How much should you trust this rating?" Computed from:

- **Sample size** -- Wilson-style penalty for small n. A game with 50 votes gets lower confidence than one with 50,000, even if both average 8.5.
- **Distribution shape** -- Tight consensus (low std dev) increases confidence. Polarized distributions (high std dev, bimodal) decrease it.
- **Deviation from global mean** -- Ratings far from the population mean require more evidence. A 9.5 average with 100 votes gets lower confidence than a 7.5 average with 100 votes, because extraordinary claims require extraordinary evidence.

The confidence formula is **published, reproducible, and deterministic** -- any consumer can verify it. It replaces `bayes_rating` as the spec-level field, because confidence is a more honest signal than an opaque adjusted number.

#### Layer 4: Implementation-Recommended Ranking

For implementations that need to *sort* games (leaderboards, "top 100" lists), the specification recommends **Bayesian scoring with a Dirichlet prior** over the 10-point rating distribution:

Instead of BGG's estimated approach (adding ~1,500 dummy votes all at a single value of ~5.5), the Dirichlet method assigns **per-bucket prior votes** across the full rating distribution. This is mathematically sound (the Dirichlet distribution is the conjugate prior for categorical data) and more expressive -- the prior can encode "we expect a game to have a roughly normal distribution centered at 6" rather than collapsing all prior weight onto a single point.

```
score = Σ(utility[i] × (prior_votes[i] + actual_votes[i])) / Σ(prior_votes[i] + actual_votes[i])
```

Where `utility[i]` maps each rating bucket to a value (e.g., 1 through 10) and `prior_votes[i]` is the per-bucket prior. The spec documents reference parameters; implementations may tune their own.

This layer is **implementation guidance, not a spec requirement.** The spec guarantees Layers 1-3. Layer 4 is a recommendation for implementations that need ranking.

### Statistical Models Considered

The following models were evaluated for the rating system. This analysis is documented to inform the commons group and future RFC discussions.

| Model | Best For | Verdict |
|-------|---------|---------|
| **Simple Bayesian Average** (BGG) | Quick ranking with small samples | Useful but insufficient -- single prior value, no confidence, no voter normalization |
| **Wilson Score Interval** | Binary up/down votes | [Good for binary signals](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html) (SteamDB uses this), awkward for 1-10 ordinal scales without binarization |
| **Dirichlet-Prior Bayesian** | Star/numeric ratings | [Best fit for this problem](https://julesjacobs.com/2015/08/17/bayesian-scoring-of-ratings.html) -- handles ordinal scales natively, tunable per-bucket priors, simple computation |
| **Item Response Theory (IRT)** | Heterogeneous voter correction | [Gold standard](https://arxiv.org/html/2405.19521v1) for separating rater bias from item quality, but requires hundreds of ratings per item and is computationally expensive. Aspirational for v2+ where declared scales are unavailable |
| **Bradley-Terry / Crowd-BT** | Pairwise comparisons | Not applicable -- we don't collect pairwise data |
| **Glicko-2 / TrueSkill** | Competitive skill estimation | Wrong domain -- designed for sequential match outcomes, not independent quality assessments |

### Anti-Gaming Considerations

A published, transparent formula is essential for a commons -- but transparency creates a target for manipulation. The rating model must be designed to resist:

**Fan brigading.** Coordinated groups inflating or deflating ratings. Mitigations: account age requirements before rating, play log verification (must log at least one play before rating), weighting by voter history diversity, anomaly detection on sudden vote spikes.

**Publisher self-promotion.** Publishers or affiliates inflating their own games. Mitigations: the spec supports **conflict-of-interest metadata** -- a voter's relationship to the game's publisher or designer can be declared or detected, and implementations can weight those votes differently (not discard them -- transparency, not censorship).

**Spite voting.** Organized downvoting campaigns against a competing game. Same mitigations as brigading, plus the Dirichlet prior naturally bounds the impact -- no single vote or small group of votes can dramatically shift a well-established rating.

**Formula exploitation.** Sophisticated actors optimizing voting patterns to maximize impact. The Dirichlet prior model is inherently robust here: each individual vote's marginal impact decreases as total votes increase, and the per-bucket prior prevents extreme distributions from dominating with few votes.

The specification recommends that conforming implementations:

1. **Publish their scoring formula.** Transparency is non-negotiable for a commons standard.
2. **Bound individual vote influence.** No single vote should be able to move a game's rating by more than a defined maximum percentage.
3. **Implement velocity limits.** Maximum N ratings per account per time period.
4. **Flag, don't silently discard.** Suspicious patterns should be flagged transparently with reason codes -- not secretly scrubbed as BGG does. The community should be able to audit moderation decisions.

### Case Study: Pre-Release Brigading

In early 2026, an unreleased crowdfunded game announced the use of AI-generated art. The community response on BGG was immediate and extreme: organized 1-star voting as a protest against the publisher's decision. This triggered a counter-response of defensive 10-star votes attempting to offset the damage. The result was a rating distribution that contains almost no quality signal:

| Rating | Votes | Distribution |
|--------|-------|--------------|
| 10 | 146 | ██████████ |
| 9 | 11 | █ |
| 8 | 7 | ▌ |
| 7 | 1 | ▏ |
| 6 | 1 | ▏ |
| 5 | 4 | ▎ |
| 4 | 0 | |
| 3 | 4 | ▎ |
| 2 | 11 | █ |
| 1 | 298 | ████████████████████ |

**Key statistics:** 479 total votes. Average: 4.10. Standard deviation: **4.16** -- against a theoretical maximum of 4.5 for a 1-10 scale. This distribution is at **92% of maximum possible disagreement**. 93% of all votes are at the two extremes (1 or 10); only 7% fall in the 2-9 range. The game has not been released -- none of these votes reflect play experience.

**What BGG reports:** BGG displays the raw average (**4.1**) to users in the UI. Under the hood, the Bayesian average (~1,500 dummy votes at ~5.5) produces an estimated geek rating of approximately **5.16**, which determines the game's ranking position -- but this number is never shown to users. A casual observer sees "4.1" and assumes it's a low-rated game. Nothing in BGG's interface signals that 93% of votes are political protest/counter-protest, not quality assessment. And the hidden ranking score of ~5.16 would place this unreleased, unplayed game alongside legitimately mediocre games that people have actually experienced.

**What OpenTabletop's model reports:**

| Metric | Brigaded Game | Brass: Birmingham (healthy reference) |
|--------|-------------|--------------------------------------|
| Raw average | 4.10 | 8.57 |
| Std deviation | 4.16 | 1.42 |
| Votes | 479 | 57,266 |
| BGG displayed | 4.1 (raw avg) | ~8.6 (raw avg) |
| BGG ranking score | ~5.16 (hidden Bayesian) | ~8.5 (hidden Bayesian) |
| **Confidence score** | **0.27** | **0.83** |

The confidence score of **0.27** (on a 0-1 scale) immediately signals: *do not trust this rating*. The high vote count (479) is not the problem -- the sample size factor is fine (0.95). The problem is the distribution shape factor (0.07) -- a std dev of 4.16 on a 1-10 scale is nearly indistinguishable from random noise at the extremes. The confidence score captures what BGG's Bayesian average cannot: that a number can be statistically "precise" (small margin of error around 4.10) while being semantically meaningless (the votes don't measure game quality).

**What the input contract would add:** If the specification requires "number of plays" as vote context metadata, every vote on this unreleased game would be flagged as a 0-play rating. Implementations could display these votes separately ("0-play ratings: 4.10 avg / 479 votes / confidence: 0.27") from post-release play-based ratings, letting consumers see the protest signal without it contaminating the quality signal.

**Detection heuristics:** This pattern is detectable:
- Std deviation above 3.5 on a 1-10 scale (healthy games rarely exceed 2.5)
- More than 80% of votes at the two extremes (1 and 10)
- Sudden vote spike correlated with a news event rather than gradual accumulation
- Zero or near-zero play logs associated with the votes

## Further Reading

- [How Not To Sort By Average Rating (Evan Miller, 2009)](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html) -- Why Wilson score intervals beat simple averages for binary ratings
- [Bayesian Scoring of Ratings (Jules Jacobs, 2015)](https://julesjacobs.com/2015/08/17/bayesian-scoring-of-ratings.html) -- Dirichlet-prior approach for star ratings, extending beyond binary
- [Reverse Engineering the BoardGameGeek Ranking](https://blog.recommend.games/posts/reverse-engineering-boardgamegeek-ranking/) -- Technical analysis of BGG's Bayesian average formula
- [Complexity Bias in BGG (Vatvani, 2018)](https://dvatvani.github.io/BGG-Analysis-Part-2.html) -- Quantitative analysis of the weight-rating correlation
- [Debiasing the BoardGameGeek Ranking](https://blog.recommend.games/posts/debiasing-boardgamegeek-ranking/) -- Methodology for removing complexity bias from rankings
- [Adjusted Board Game Geek Ratings (2025 update)](https://dvatvani.com/blog/bgg-interactive-analysis-2025) -- Updated interactive analysis
- [Crowdsourcing with Difficulty: A Bayesian Rating Model for Heterogeneous Items (2024)](https://arxiv.org/html/2405.19521v1) -- IRT-based approach for crowdsourced ratings
- [Data Provenance & Bias](./data-provenance.md) -- OpenTabletop's philosophical foundation for handling subjective data
