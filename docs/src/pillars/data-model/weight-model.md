# Weight Model

"Weight" is the board game community's term for perceived complexity. It is the single most misunderstood metric in board game databases -- treated as an objective property of a game when it is actually a perception that varies by voter, context, and community.

## How OpenTabletop Stores Weight

The [Game entity](./games.md) carries these weight fields:

| Field | Type | Description |
|-------|------|-------------|
| `weight` | float (1.0-5.0) | Community-voted average complexity |
| `weight_votes` | integer | Number of votes contributing to the average |

The specification treats weight as a **community perception metric**, not an intrinsic game property. The `weight_votes` field is critical context: a weight of 3.5 with 5,000 votes is a stable signal; 3.5 with 12 votes is noise.

## The 1.0-5.0 Scale

The weight scale uses anchor games as calibration reference points (see [Taxonomy Criteria](./taxonomy-criteria.md) for the full table):

| Weight | Label | Anchor Games |
|--------|-------|-------------|
| 1.0 | Trivial | *Candy Land*, *Chutes and Ladders* |
| 2.0 | Light-Medium | *Ticket to Ride*, *Sushi Go!* |
| 3.0 | Medium-Heavy | *Terraforming Mars*, *Wingspan* |
| 4.0 | Heavy | *Twilight Imperium*, *Agricola* |
| 5.0 | Extreme | *The Campaign for North Africa*, *ASL* |

## What Weight Actually Measures (And Doesn't)

Weight conflates several distinct dimensions into a single number:

- **Rules complexity** -- How many rules are there? How many exceptions? How long does the rulebook take to read?
- **Strategic depth** -- How much does skill matter? How many meaningful decisions per turn?
- **Decision density** -- How many choices does each turn present? How much do they interact?
- **Cognitive load** -- How much state must a player track mentally? How far ahead must they plan?
- **Fiddliness** -- How many physical components must be manipulated? How many bookkeeping steps per round?
- **Game length** -- Longer games tend to be rated heavier, even if individual turns are simple.

A game like *Twilight Imperium* is heavy on nearly every dimension. But a game like *Go* has trivial rules complexity, zero fiddliness, and extreme strategic depth -- yet gets a moderate weight rating because voters mentally average across all dimensions. The single-number weight rating cannot distinguish these profiles.

## Known Problems with the Weight Model

### 1. Weight Is Perceptual, Not Objective

The same game receives genuinely different weight perceptions from different populations:

- An experienced strategy gamer who plays *Mage Knight* weekly might rate *Terraforming Mars* a 2.5 ("moderate -- fewer subsystems than what I usually play").
- A casual gamer encountering *Terraforming Mars* for the first time might rate it 4.5 ("one of the most complex games I've ever played").
- Both assessments are valid within their reference frames. The aggregate average reflects the voter population, not the game.

### 2. No Calibration Mechanism

Unlike the rating scale (where everyone agrees "10 means I love it"), the weight scale has no universally understood anchors. The informal anchor games listed above help, but voters rarely consult them before voting. Most weight votes are intuitive, based on how a game *felt* relative to the voter's personal experience -- not an objective assessment against a calibrated scale.

### 3. Complexity Bias in Ratings

[Dinesh Vatvani's analysis](https://dvatvani.github.io/BGG-Analysis-Part-2.html) quantifies a significant correlation between weight and BGG rating:

- **Regression slope: ~0.63** -- For each point increase in weight (1-5 scale), the average BGG rating increases by ~0.63 points (1-10 scale).
- **Total effect: ~2.5 points** -- The heaviest games on BGG average roughly 2.5 rating points higher than the lightest games.
- **This is not because complex games are better.** It's because BGG's voter population disproportionately values complexity. Experienced hobbyists who rate games on BGG tend to prefer heavier games, and the same population votes on both weight and rating.

The practical effect: light games that are excellent for their audience (party games, family games, gateway games) are systematically underrated relative to heavy games. A brilliant party game like *Codenames* sits at 7.6 while a heavy strategy game of comparable design quality sits at 8.5+.

### 4. "The Tail of Spite"

Vatvani's analysis identifies a cluster of old, mass-market games with both low weight and extremely low ratings: *Monopoly* (4.4), *Candy Land* (3.2), *Snakes and Ladders* (2.8). These games are rated by people who grew up with them and now rate them harshly from the perspective of experienced hobbyists. The ratings don't reflect these games' fitness for their intended audience (children, families, casual play) -- they reflect the BGG community's disdain for simplicity.

### 5. Self-Selected Voter Population

The people who rate weight on BGG are overwhelmingly experienced hobbyist gamers. Their perception of "how complex is this?" is calibrated against hundreds of games they've played. A casual gamer's 4.0 rating and a hardcore gamer's 2.5 rating for the same game are both "correct" within their frame -- but only the hardcore gamer's vote is likely to be recorded on BGG.

This means weight ratings are most accurate for the middle-to-heavy portion of the spectrum (2.5-4.5) where BGG's voter population has the most experience. Very light games (1.0-2.0) and the extremes of heaviness (4.5-5.0) are less reliably rated because fewer voters have extensive experience at those ends.

### 6. Experience Modifies Perception

A game's perceived weight decreases with experience. *Spirit Island* might feel like a 4.5 on first play and a 3.5 after twenty plays -- but the voter only submits one number. When that number was submitted matters, and BGG doesn't track whether a weight vote came from a first-time player or a veteran. The aggregate weight reflects an unknowable mix of experience levels.

## OpenTabletop's Approach

The specification acknowledges weight's limitations while preserving its utility as the best available community signal for complexity:

1. **Store the raw average and vote count.** The `weight` and `weight_votes` fields provide the signal and its sample size. Consumers can assess reliability.

2. **Expose the distribution where possible.** The specification's commitment to distributional data (see [Data Provenance & Bias](./data-provenance.md)) means implementations are encouraged to store and expose weight vote distributions, not just averages. A bimodal weight distribution (many 2.0 votes and many 4.0 votes) signals that different player populations perceive the game very differently.

3. **Don't treat weight as absolute.** The specification never says a game "is" a specific weight. It says the community rated it at that weight. Applications should present weight in context: "Rated 3.86 by 5,127 voters" rather than "Weight: 3.86."

4. **Anchor games provide calibration.** The [Taxonomy Criteria](./taxonomy-criteria.md) weight scale with anchor games gives voters and implementations a shared reference frame. When a voter considers whether *Brass: Birmingham* is a 3.5 or a 4.0, comparing it to the anchor games at each level produces more consistent results than an unaided gut feeling.

5. **Consider debiasing for rankings.** Implementations that rank games should consider [complexity-bias correction](https://blog.recommend.games/posts/debiasing-boardgamegeek-ranking/) -- a simple linear regression that produces "complexity-agnostic" ratings. This surfaces excellent light games that the raw rankings bury.

### Input Contract

The weight model follows the specification's [Input Contract](./data-provenance.md#input-contract) principles. Because weight conflates multiple distinct dimensions (see [What Weight Actually Measures](#what-weight-actually-measures-and-doesnt) above), the specification supports two input modes:

#### Quick Mode

A single composite rating for voters who want a fast, familiar experience:

| Element | Definition |
|---------|-----------|
| **Question** | "How complex is *[Game]*?" |
| **Scale** | 1.0-5.0, with [anchor games](./taxonomy-criteria.md#weight-scale-calibration) visible at input time (e.g., 1.0 = *Candy Land*, 2.5 = *Carcassonne*, 3.5 = *Brass: Birmingham*, 5.0 = *Campaign for North Africa*) |
| **Context captured** | Number of plays of this game, self-assessed experience level (new to hobby / casual / experienced / hardcore) |
| **Transparency** | "Your vote is recorded as-is. The aggregate reflects this community's perception, not an intrinsic property of the game." |

#### Detailed Mode (Dimensional Survey)

An optional decomposed survey where each dimension of "weight" is rated independently. This eliminates the "what does weight mean?" ambiguity by asking concrete, answerable questions:

| Dimension | Question | 1 (Low) | 5 (High) |
|-----------|----------|---------|----------|
| **Rules complexity** | "How many rules and exceptions does *[Game]* have?" | Minimal rules, learned in minutes (e.g., *Uno*) | Extensive rulebook, many exceptions (e.g., *ASL*) |
| **Strategic depth** | "How much does skill matter vs luck?" | Mostly luck or randomness | Deep strategy, rewards experience |
| **Decision density** | "How many meaningful choices do you face each turn?" | One simple choice per turn | Many interacting decisions per turn |
| **Cognitive load** | "How much game state must you track mentally?" | Minimal -- focus on your own position | Must track multiple players' plans turns ahead |
| **Fiddliness** | "How much bookkeeping and component management?" | Almost none | Constant upkeep, tracking, and maintenance |
| **Game length** | "How does session length contribute to the sense of weight?" | Quick, light sessions (< 30 min) | Long, intensive sessions (3+ hours) |

The composite weight is computed as the mean of the dimensional ratings (or an implementation-defined weighted average). Implementations may choose to weight certain dimensions more heavily -- for example, weighting strategic depth higher than fiddliness if their audience considers depth more important than busywork.

#### Why Dimensional Data Matters

Dimensional weight data enables queries that a single number cannot:

- "Show me games with high strategic depth but low fiddliness" -- separates good complexity from tedious complexity.
- "Show me games with low rules complexity but high decision density" -- finds elegant designs with simple rules and deep decisions (e.g., *Go*, *Azul*).
- "Show me games where cognitive load is high but rules complexity is low" -- finds games that are easy to learn but hard to master.

A game like *Go* has trivial rules complexity (1/5), zero fiddliness (1/5), but extreme strategic depth (5/5) and high cognitive load (5/5). Its composite weight of ~3.0 looks "medium" -- but the dimensional profile reveals it is anything but average. A game like *Twilight Imperium* scores 4-5 on every dimension -- its 4.4 composite accurately represents uniform heaviness. The single number hides the profile; the dimensions reveal it.

#### Partial Responses

Voters may answer any subset of dimensions. A voter who answers 3 of 6 dimensions still provides useful signal. The composite is computed from available dimensions only, with the response count tracked per dimension for confidence assessment.

#### Backward Compatibility

Quick mode produces the same single-number weight that existing consumers expect. Implementations that support only quick mode are fully conforming. Detailed mode is additive -- it enriches the data without breaking any existing interface.

## Further Reading

- [Complexity Bias in BGG (Vatvani, 2018)](https://dvatvani.github.io/BGG-Analysis-Part-2.html) -- Quantitative analysis of the weight-rating correlation
- [Adjusted Board Game Geek Ratings (2025 update)](https://dvatvani.com/blog/bgg-interactive-analysis-2025) -- Interactive, updated debiased rankings
- [Debiasing the BoardGameGeek Ranking](https://blog.recommend.games/posts/debiasing-boardgamegeek-ranking/) -- Methodology for removing complexity bias
- [Weight: Depth vs. Complexity (BGG forum)](https://boardgamegeek.com/geeklist/200613/weight-depth-vs-complexity-results-and-analysis) -- Community discussion of what weight actually measures
- [Data Provenance & Bias](./data-provenance.md) -- OpenTabletop's philosophical foundation for handling subjective data
- [Rating Model](./rating-model.md) -- Companion document on BGG's rating system and its problems
