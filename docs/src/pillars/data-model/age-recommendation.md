# Age Recommendation Model

Age recommendations serve two audiences: parents choosing games for children, and groups gauging whether a game's complexity matches their comfort level. The publisher prints "14+" on the box, but the community may consider 12 perfectly appropriate. The age recommendation model captures both perspectives as separate, independent data points.

## Publisher-Stated Age

The `min_age` field on the [Game entity](./games.md) stores what the publisher prints on the box:

| Field | Type | Description |
|-------|------|-------------|
| `min_age` | integer | Publisher's recommended minimum age in years |

This is a factual record of what the publisher claims. It is useful for filtering and comparison, but it reflects the publisher's judgment — which is shaped by factors beyond gameplay suitability.

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

### Example: Scythe

*Scythe* is a medium-heavy strategy game. The publisher rates it at 14+.

| Suggested Age | Votes |
|---------------|-------|
| 10 | 28 |
| 12 | 156 |
| 14 | 312 |
| 16 | 45 |

The community suggested age is **12**. A significant portion of voters (156 of 541, 29%) believe 12-year-olds can handle the game, and only 8% think it requires players older than the publisher's recommendation. The 14+ rating likely reflects the game's strategic depth more than any content concern.

### Example: Ticket to Ride

*Ticket to Ride* is a gateway game. The publisher rates it at 8+.

| Suggested Age | Votes |
|---------------|-------|
| 6 | 89 |
| 8 | 423 |
| 10 | 67 |

The community suggested age is **8** — aligning with the publisher. Simpler games tend to show stronger publisher-community agreement because there is less ambiguity between "can physically play" and "can strategically engage."

## Age with Expansions

Expansions can change age recommendations. *Scythe: The Rise of Fenris* is publisher-rated at 12+ while the base game is 14+ — the campaign's guided structure makes the game more accessible to younger players.

Age changes are modeled through the same [property delta system](./property-deltas.md) as player count and play time:

- **PropertyModification**: An expansion can set a new `min_age` value (e.g., *Fenris* sets `min_age` to 12).
- **ExpansionCombination**: An explicit combination record can include an `effective_min_age` when the combined age recommendation has been community-verified.

Multi-expansion combination ages are not assumed from individual expansion data. If *Fenris* is 12+ but *Invaders from Afar* is 14+, the system does not guess what the combined age recommendation should be — it only includes `effective_min_age` when the value has been explicitly curated.

When [effective mode](../filtering/effective-mode.md) is enabled, age filtering considers expansion-modified recommendations where available.

## Data Provenance

Community age polls reflect the voting community's perspective — predominantly experienced hobbyist gamers who may assess age appropriateness differently from parents, educators, or child development specialists. A hobbyist who taught their 10-year-old *Scythe* may vote "10" based on their child's specific aptitude, while a parent browsing for family games may have a more conservative threshold.

The raw vote distribution enables consumers to apply their own interpretive thresholds appropriate to their audience. See [Data Provenance & Bias](./data-provenance.md) for more on how community data is shaped by who contributes it.
