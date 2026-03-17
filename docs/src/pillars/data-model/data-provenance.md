# Data Provenance & Bias

Every number in a board game database is somebody's opinion. Weight, playtime, ratings, player count recommendations -- none of these are intrinsic properties of a game. They are perceptions, shaped by who measured them, how they measured, and what they compared against. The OpenTabletop specification is designed with this reality in mind.

## Two Layers of Subjectivity

Board game data has two distinct sources, and both are subjective:

### Layer 1: Designer Intent

The values printed on the box -- player count range, play time, recommended age -- come from the designer and playtesters. These are educated estimates made by a small group of people deeply familiar with the game, often in controlled testing conditions:

- **Playtime** is estimated during playtesting, typically with experienced players who know the rules. First-time players, groups prone to analysis paralysis, or players unfamiliar with the genre may take 50-200% longer.
- **Player count** is what the designer validated the rules for. Whether the game is *good* at those counts is a separate question the designer may not be positioned to answer objectively.
- **Age recommendation** reflects the designer's judgment about cognitive complexity, not a rigorous developmental assessment.

These values are useful as a baseline, but they represent a single data point from a specific (and non-representative) group.

### Layer 2: Community Perception

Community-sourced data -- weight ratings, play time logs, player count polls, game ratings -- comes from voters on platforms like BoardGameGeek. This data has several structural biases:

- **Self-selection.** The people who rate games, log plays, and vote on player counts are not a random sample of "gamers." They are engaged hobbyists who spend time on board game websites -- a population that, on platforms like BGG, skews toward experienced, Western, English-speaking enthusiasts. OpenTabletop's design as a specification (not a single platform) enables multiple independent communities to maintain their own voting populations. A Japanese implementation reflects Japanese gamer preferences; a German implementation reflects German preferences. The bias is a property of *who contributes to a specific instance*, not the specification itself.
- **Experience asymmetry.** Experienced players are overrepresented. Someone who has played *Everdell* 50 times contributes the same one vote as someone who played it once. But their perception of weight and playtime will be very different.
- **Recency and novelty.** Games get the most votes shortly after release, when excitement is high. Ratings may drift downward (or upward) as the initial enthusiasm fades and more critical voices weigh in.
- **Cultural context.** Different gaming cultures value different things. The German-speaking eurogame community, the American thematic/Ameritrash community, the East Asian gaming community, and the wargaming community would each produce different top-100 lists, different weight calibrations, and different player count recommendations.

## What This Means for Specific Metrics

### Ratings Are Taste

A game rated 8.3 is not objectively "better" than one rated 7.8. Ratings reflect the intersection of game design and voter population preferences. The BGG top 100 is a popularity contest within a specific demographic -- experienced hobbyist gamers who self-select into an English-language board game community and spend time rating games.

Different populations would produce entirely different top-100 lists:
- **Families with young children** would elevate accessible, shorter games.
- **Wargamers** would surface hex-and-counter simulations that rarely appear on BGG's overall rankings.
- **Party gamers** would rank social deduction and word games much higher.
- **Non-Western markets** would include games with limited distribution in North America and Europe.

None of these lists would be more "correct" than any other. They would each accurately reflect their community's preferences. Because OpenTabletop is a specification -- not a centralized platform -- these different communities can each run conforming servers with their own data, producing population-specific rankings that honestly represent their audience rather than pretending to be universal.

### Weight Is Perceptual

A game does not "have" a weight of 3.86. A specific population of voters rated it 3.86. This number is a useful signal -- it tells you where *that community* places the game on a complexity spectrum -- but it is not an intrinsic property of the game.

Consider *Everdell*. An experienced strategy gamer who plays heavy euros might rate it 2.0 ("light -- straightforward tableau building with limited interaction"). A casual gamer encountering it for the first time might rate it 4.0 ("complex -- many card combos, resource types, and seasonal timing to track"). Both are valid assessments from different reference frames.

The specification exposes weight as a **vote distribution**, not just an average, precisely because the distribution tells a richer story. A bimodal distribution (many 2.0 votes and many 4.0 votes) signals genuine disagreement about complexity -- likely because the voter population spans different experience levels.

### Player Count Ratings Are Population-Dependent

When the community rates *Everdell* at 4.8/5 at 2 players and 2.9/5 at 4 players, those ratings reflect the priorities of experienced BGG voters who value low downtime and tight resource competition. A casual group playing for the aesthetics and card combos might find 4-player *Everdell* perfectly enjoyable -- their threshold for "too much downtime" may be different.

The specification stores raw vote distributions so that consumers can apply their own interpretive thresholds. An app targeting hardcore gamers might use stricter thresholds for "recommended"; a family-oriented app might use looser ones.

### Playtime Is Contextual

The same game at the same player count can take wildly different amounts of time depending on:

- **Player experience.** First plays routinely take 1.5-2x longer than experienced plays. The specification's experience-adjusted playtime model ([ADR-0034](../../adr/0034-experience-bucketed-playtime.md)) addresses this, but even within experience levels there is high variance.
- **Analysis paralysis.** Some groups deliberate every decision; others play on instinct. A "90 minute game" can take 45 minutes with fast players or 3 hours with deliberative ones.
- **Teaching overhead.** A play session that includes rules explanation can double the total time. Community play logs rarely distinguish "time spent teaching" from "time spent playing."
- **Group dynamics.** Social conversation, side discussions, food breaks -- all extend real-world play time in ways that are culturally variable and not captured by any logging system.

Community play time data provides a more detailed picture than publisher estimates, but it still reflects the play patterns of people who log their games -- who tend to be more experienced hobbyist gamers playing with other experienced gamers.

### Age Recommendations Are Culturally Variable

A publisher's "14+" rating and a community's "12" recommendation both reflect specific cultural assumptions about what children can handle. A European gaming family may consider a 10-year-old ready for medium-weight strategy; an American parent may draw the line at 14. Neither is wrong -- they apply different thresholds for cognitive challenge, thematic content, and session length tolerance.

The specification stores both publisher-stated and community-assessed ages as independent data points. See [Age Recommendation Model](./age-recommendation.md).

## Why the Specification Exposes Distributions

This is the philosophical core of [Pillar 3: Statistical Foundation](../../pillars/statistics/overview.md). By exposing raw vote distributions, percentiles, and per-player-count breakdowns, the specification lets consumers decide how to interpret the data for their own audience.

The specification does not say "this game is heavy." It says "here is how N people voted on complexity -- here is the distribution, the mean, the spread." An application serving experienced eurogamers can interpret that distribution differently than an application helping families find game-night picks.

| What the spec provides | What it does NOT claim |
|------------------------|----------------------|
| Rating distribution | "This game IS an 8.3/10 game" |
| Vote distribution for weight | "This game IS weight 3.86" |
| Per-count rating breakdowns | "This game IS best at 2" |
| Community playtime percentiles | "This game TAKES 120 minutes" |
| Publisher + community age data | "This game IS appropriate for 12+" |

The raw data is the foundation. The interpretation belongs to the consumer.

## Input Contract

Every voter-facing data collection point in the specification -- ratings, weight, player count quality, playtime, age recommendations -- must follow an **input contract** that ensures the data is interpretable before any statistical model touches it. If voters don't understand what they're being asked, no amount of mathematical sophistication fixes the resulting data.

### The Four Principles

1. **The question must be unambiguous.** The voter must know exactly what they're rating. "Rate this game" is insufficient -- rate *what* about it? Each model doc specifies the exact question to present.

2. **The scale must be defined and visible at input time.** Anchor definitions (what does 1 mean? what does 5 mean?) must be shown to the voter *before* they vote, not buried in documentation. Scale calibration reduces the variance caused by voters interpreting numbers differently.

3. **The voter's context must be captured as metadata.** Declared scale preference (if the model supports it), experience level with this specific game, number of plays, and any other relevant context -- recorded alongside the vote, not inferred after the fact. Context is the normalization key.

4. **What happens with the data must be transparent.** If a vote is normalized, weighted, or adjusted, the voter should understand how. "Your 4/5 is recorded as 8/10 on the canonical scale because you declared a 1-5 preference" -- not a black box.

### Per-Model Contracts

Each community-input model defines its own specific input contract:

| Model | Question | Scale | Key Context |
|-------|----------|-------|-------------|
| [Rating](./rating-model.md) | "Rate your overall experience with *[Game]*" | 1-10 (voter-declared scale supported) | Declared scale preference, number of plays |
| [Weight](./weight-model.md) | "How complex is *[Game]*?" | 1.0-5.0 with anchor games | Experience level, number of plays |
| [Player Count](./player-count.md) | "Rate your experience playing *[Game]* at *[N]* players" | 1-5 per count | Number of plays at this count |
| [Play Time](./playtime.md) | "How long did your session of *[Game]* take?" | Minutes | Player count, experience level, teaching included? |
| [Age Recommendation](./age-recommendation.md) | "What is the youngest age you'd recommend for *[Game]*?" | Age in years | Basis (played with children, professional, gut feeling) |

### Voter Context and the Player Entity

The context captured per-vote (declared scale, experience level, play count) is a subset of the voter's persistent profile. When a voter has a [Player entity](./players.md), their declared preferences (rating scale, experience level) are stored once and applied across all their votes -- they don't need to re-declare their scale preference every time they rate a game.

For anonymous votes (no linked Player entity), per-vote context metadata is still captured where possible, but lacks the longitudinal continuity that a Player profile provides. See [Players & Collections](./players.md) for how the Player entity connects to each model's input contract and enables corpus-based analysis.

## Implications for Implementations

Conforming implementations should consider data provenance when serving their users:

- **Be transparent about sources.** If weight data comes from BGG, say so. If it comes from a different community (a Japanese board game site, a wargaming forum), that context matters for interpretation.
- **Consider your audience.** If your implementation serves casual/family gamers, BGG-sourced weight ratings may not align with your users' perceptions. Providing your own community's weight data alongside BGG-sourced data lets users see both perspectives.
- **Don't conflate sample size with accuracy.** More votes does not mean "more correct" -- it means more precise *within that population*. 10,000 votes from experienced eurogamers still only tells you what experienced eurogamers think.
- **Expose the distribution.** The specification's data structures are designed for distributional data precisely so that downstream consumers can make informed interpretations. Collapsing a distribution to a single number loses the signal that matters most: the shape of disagreement.
