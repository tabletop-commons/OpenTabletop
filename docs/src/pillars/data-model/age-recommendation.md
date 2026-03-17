# Age Recommendation Model

Age recommendations serve two audiences: parents choosing games for children, and groups gauging whether a game's complexity matches their comfort level. The publisher prints "14+" on the box, but the community may consider 12 perfectly appropriate. The age recommendation model captures both perspectives as separate, independent data points.

## Publisher-Stated Age

The `min_age` field on the [Game entity](./games.md) stores what the publisher prints on the box:

| Field | Type | Description |
|-------|------|-------------|
| `min_age` | integer | Publisher's recommended minimum age in years |

This is a factual record of what the publisher claims. It is useful for filtering and comparison, but it reflects the publisher's judgment -- which is shaped by factors beyond gameplay suitability.

### Why Publisher Ages Are Conservative

Publisher age recommendations are systematically biased toward higher numbers for several reasons:

- **Liability.** A lower age recommendation increases the publisher's exposure if a parent considers the game inappropriate. Erring high is the safer legal default.
- **Complexity conflation.** A "14+" rating often means "this is a complex strategy game," not "this game contains content inappropriate for 13-year-olds." The age number conflates cognitive difficulty with content suitability.
- **Regulatory variation.** Different countries have different safety and labeling requirements. The "3+" CE marking in the EU is about small parts and choking hazards, not gameplay difficulty. Publishers sometimes set a higher age floor to sidestep regulatory categories entirely.
- **One size fits all.** A single number cannot capture "simple enough at 10 with parental guidance, independently at 14." Publisher ratings must collapse a spectrum into a single threshold.

## Community Age Polls

The `CommunityAgePoll` entity captures community votes on what minimum age they would recommend:

| Field | Type | Description |
|-------|------|-------------|
| `game_id` | UUIDv7 | The game being rated |
| `suggested_age` | integer | The minimum age voters selected |
| `vote_count` | integer | Number of voters who selected this age |

Community members vote on the age they believe is appropriate. Unlike player count polls (which offer Best/Recommended/Not Recommended), age polls are simpler: voters pick the minimum age they would suggest. The distribution of votes reveals how the community's assessment compares to the publisher's.

The Game entity includes a pre-computed derived field:

| Field | Type | Description |
|-------|------|-------------|
| `community_suggested_age` | integer (nullable) | Community-polled suggested minimum age |

This is computed as the median of all votes, providing a single representative value. The raw poll data is always available for custom analysis.

### Example: Pandemic

*Pandemic* is a cooperative strategy game. The publisher rates it at 8+.

| Suggested Age | Votes |
|---------------|-------|
| 6 | 12 |
| 8 | 87 |
| 10 | 298 |
| 12 | 134 |
| 14 | 23 |

The community suggested age is **10** -- two years higher than the publisher's box rating. While an 8-year-old can physically play (move pawns, draw cards), the cooperative strategy layer -- managing hand cards across players, planning multi-turn cure sequences, and prioritizing outbreak containment -- requires the kind of forward planning that most voters consider a 10-year-old task. The gap between "can play" and "can meaningfully contribute to strategy" is exactly what the community poll captures.

### Example: Ticket to Ride

*Ticket to Ride* is a gateway game. The publisher rates it at 8+.

| Suggested Age | Votes |
|---------------|-------|
| 6 | 89 |
| 8 | 423 |
| 10 | 67 |

The community suggested age is **8** -- aligning with the publisher. Simpler games tend to show stronger publisher-community agreement because there is less ambiguity between "can physically play" and "can strategically engage."

## Age with Expansions

Expansions can change age recommendations. *Pandemic Legacy: Season 1* is publisher-rated at 13+ while the base *Pandemic* is 8+ -- the legacy campaign introduces mature themes (permanent city destruction, character death, narrative tension) and requires a sustained multi-session commitment that raises the appropriate age significantly.

Age changes are modeled through the same [property delta system](./property-deltas.md) as player count and play time:

- **PropertyModification**: An expansion can set a new `min_age` value (e.g., *Pandemic Legacy: Season 1* sets `min_age` to 13).
- **ExpansionCombination**: An explicit combination record can include an `effective_min_age` when the combined age recommendation has been community-verified.

Multi-expansion combination ages are not assumed from individual expansion data. The system only includes `effective_min_age` when the value has been explicitly curated -- it does not guess from individual expansion ages.

When [effective mode](../filtering/effective-mode.md) is enabled, age filtering considers expansion-modified recommendations where available.

## OpenTabletop's Approach

### Input Contract

The age recommendation model follows the specification's [Input Contract](./data-provenance.md#input-contract) principles:

| Element | Age-Specific Definition |
|---------|------------------------|
| **Question** | "What is the youngest age you'd recommend for *[Game]*?" |
| **Scale** | Age in years (integer) |
| **Context captured** | Basis for assessment: played with children of this age / professional judgment (educator, child development) / general impression. Whether the voter has children. |
| **Transparency** | "Your recommendation is recorded alongside your basis. The aggregate is weighted by basis type -- assessments from voters who have played with children of the recommended age carry more weight than general impressions." |

## Data Provenance

Community age polls reflect the voting community's perspective -- predominantly experienced hobbyist gamers who may assess age appropriateness differently from parents, educators, or child development specialists. A hobbyist who taught their 8-year-old *Pandemic* may vote "8" based on their child's specific aptitude, while a parent browsing for family games may have a more conservative threshold.

The raw vote distribution enables consumers to apply their own interpretive thresholds appropriate to their audience. See [Data Provenance & Bias](./data-provenance.md) for more on how community data is shaped by who contributes it.
