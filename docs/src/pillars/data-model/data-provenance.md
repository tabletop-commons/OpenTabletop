# Data Provenance & Bias

Every number in a board game database is somebody's opinion. Weight, playtime, ratings, player count recommendations — none of these are intrinsic properties of a game. They are perceptions, shaped by who measured them, how they measured, and what they compared against. The OpenTabletop specification is designed with this reality in mind.

## Two Layers of Subjectivity

Board game data has two distinct sources, and both are subjective:

### Layer 1: Designer Intent

The values printed on the box — player count range, play time, recommended age — come from the designer and playtesters. These are educated estimates made by a small group of people deeply familiar with the game, often in controlled testing conditions:

- **Playtime** is estimated during playtesting, typically with experienced players who know the rules. First-time players, groups prone to analysis paralysis, or players unfamiliar with the genre may take 50-200% longer.
- **Player count** is what the designer validated the rules for. Whether the game is *good* at those counts is a separate question the designer may not be positioned to answer objectively.
- **Age recommendation** reflects the designer's judgment about cognitive complexity, not a rigorous developmental assessment.

These values are useful as a baseline, but they represent a single data point from a specific (and non-representative) group.

### Layer 2: Community Perception

Community-sourced data — weight ratings, play time logs, player count polls, game ratings — comes from voters on platforms like BoardGameGeek. This data has several structural biases:

- **Self-selection.** The people who rate games, log plays, and vote on player counts are not a random sample of "gamers." They are engaged hobbyists who spend time on board game websites — a population that skews toward experienced, Western, English-speaking enthusiasts.
- **Experience asymmetry.** Experienced players are overrepresented. Someone who has played Spirit Island 50 times contributes the same one vote as someone who played it once. But their perception of weight and playtime will be very different.
- **Recency and novelty.** Games get the most votes shortly after release, when excitement is high. Ratings may drift downward (or upward) as the initial enthusiasm fades and more critical voices weigh in.
- **Cultural context.** Different gaming cultures value different things. The German-speaking eurogame community, the American thematic/Ameritrash community, the East Asian gaming community, and the wargaming community would each produce different top-100 lists, different weight calibrations, and different player count recommendations.

## What This Means for Specific Metrics

### Weight Is Perceptual

A game does not "have" a weight of 3.86. A specific population of voters rated it 3.86. This number is a useful signal — it tells you where *that community* places the game on a complexity spectrum — but it is not an intrinsic property of the game.

Consider Spirit Island. An experienced strategy gamer who plays heavy euros might rate it 3.0 ("moderately complex — fewer subsystems than Mage Knight"). A family gamer encountering it for the first time might rate it 5.0 ("the most complex game I've ever played"). Both are valid assessments from different reference frames.

The specification exposes weight as a **vote distribution**, not just an average, precisely because the distribution tells a richer story. A bimodal distribution (many 2.0 votes and many 4.0 votes) signals genuine disagreement about complexity — likely because the voter population spans different experience levels.

### Playtime Is Contextual

The same game at the same player count can take wildly different amounts of time depending on:

- **Player experience.** First plays routinely take 1.5-2x longer than experienced plays. The specification's experience-adjusted playtime model (ADR-0034) addresses this, but even within experience levels there is high variance.
- **Analysis paralysis.** Some groups deliberate every decision; others play on instinct. A "90 minute game" can take 45 minutes with fast players or 3 hours with deliberative ones.
- **Teaching overhead.** A play session that includes rules explanation can double the total time. Community play logs rarely distinguish "time spent teaching" from "time spent playing."
- **Group dynamics.** Social conversation, side discussions, food breaks — all extend real-world play time in ways that are culturally variable and not captured by any logging system.

Community play time data provides a more detailed picture than publisher estimates, but it still reflects the play patterns of people who log their games — who tend to be more experienced hobbyist gamers playing with other experienced gamers.

### Ratings Are Taste

A game rated 8.3 is not objectively "better" than one rated 7.8. Ratings reflect the intersection of game design and voter population preferences. The BGG top 100 is a popularity contest within a specific demographic — experienced hobbyist gamers who self-select into an English-language board game community and spend time rating games.

Different populations would produce entirely different top-100 lists:
- **Families with young children** would elevate accessible, shorter games.
- **Wargamers** would surface hex-and-counter simulations that rarely appear on BGG's overall rankings.
- **Party gamers** would rank social deduction and word games much higher.
- **Non-Western markets** would include games with limited distribution in North America and Europe.

None of these lists would be more "correct" than any other. They would each accurately reflect their community's preferences.

### Player Count Recommendations Are Population-Dependent

When 876 people vote that Spirit Island is "Best at 2" and 489 vote that it's "Not Recommended at 4," those votes reflect the priorities of experienced BGG voters. A casual group playing for fun might find 4-player Spirit Island perfectly enjoyable — their threshold for "too long" or "too much downtime" may be different.

The specification stores raw vote distributions so that consumers can apply their own interpretive thresholds. An app targeting hardcore gamers might use stricter thresholds for "recommended"; a family-oriented app might use looser ones.

## Why the Specification Exposes Distributions

This is the philosophical core of [Pillar 3: Statistical Foundation](../../pillars/statistics/overview.md). By exposing raw vote distributions, percentiles, and per-player-count breakdowns, the specification lets consumers decide how to interpret the data for their own audience.

The specification does not say "this game is heavy." It says "here is how N people voted on complexity — here is the distribution, the mean, the spread." An application serving experienced eurogamers can interpret that distribution differently than an application helping families find game-night picks.

| What the spec provides | What it does NOT claim |
|------------------------|----------------------|
| Vote distribution for weight | "This game IS weight 3.86" |
| Community playtime percentiles | "This game TAKES 120 minutes" |
| Per-count poll breakdowns | "This game IS best at 2" |
| Rating distribution | "This game IS an 8.3/10 game" |

The raw data is the foundation. The interpretation belongs to the consumer.

## Implications for Implementations

Conforming implementations should consider data provenance when serving their users:

- **Be transparent about sources.** If weight data comes from BGG, say so. If it comes from a different community (a Japanese board game site, a wargaming forum), that context matters for interpretation.
- **Consider your audience.** If your implementation serves casual/family gamers, BGG-sourced weight ratings may not align with your users' perceptions. Providing your own community's weight data alongside BGG-sourced data lets users see both perspectives.
- **Don't conflate sample size with accuracy.** More votes does not mean "more correct" — it means more precise *within that population*. 10,000 votes from experienced eurogamers still only tells you what experienced eurogamers think.
- **Expose the distribution.** The specification's data structures are designed for distributional data precisely so that downstream consumers can make informed interpretations. Collapsing a distribution to a single number loses the signal that matters most: the shape of disagreement.
