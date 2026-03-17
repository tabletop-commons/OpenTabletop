# Pillar 3: Statistical Foundation

The third pillar of OpenTabletop is a commitment: **raw data is a first-class output.** Every opinion-based data point in the system -- player count polls, weight votes, community play times, expansion property modifications -- is available as exportable, analyzable data. The specification does not lock consumers into one algorithm for "best player count" or one definition of "weight." It provides the underlying distributions and lets consumers decide.

## Why This Matters

Board game data is full of derived values that obscure the underlying reality:

- **BGG's "best player count"** is a single number derived from poll data using an undocumented algorithm. You cannot see the vote distribution. You cannot apply a different threshold. You cannot ask "is this game controversial at 4 players?" because the raw votes are not exposed.

- **BGG's "weight"** is an average. You cannot see whether the average of 3.5 comes from a bimodal distribution (half say 2.0, half say 5.0) or a consensus (everyone says 3.5). These are very different signals about a game's complexity.

- **BGG's "geek rating"** applies a Bayesian average that penalizes games with few votes. The formula is not public. You cannot recompute it, adjust it, or replace it with your own ranking system.

OpenTabletop's position is that these derived values are useful but they belong in *application logic*, not in the data specification. The specification provides the raw inputs -- vote distributions, individual data points, exportable collections -- and lets applications build whatever derived values serve their users.

## What the Statistical Foundation Provides

### 1. Raw Vote Distributions

Every poll-based value exposes the full vote breakdown:

- **Player count polls**: For each supported player count, the exact number of Best, Recommended, and Not Recommended votes. See [Data Structures](./data-structures.md).
- **Weight votes**: The distribution of weight votes (how many people voted 1.0, how many voted 2.0, etc.), not just the average.
- **Rating votes**: The distribution of rating votes across the 1-10 scale.

### 2. Expansion Delta Data

Property modifications and expansion combinations are not just used internally for [effective mode filtering](../filtering/effective-mode.md) -- they are queryable and exportable entities. A data scientist can download all property modifications to analyze patterns like:

- "How much does adding an expansion typically increase play time?"
- "Do expansions tend to increase or decrease the best player count?"
- "Is there a correlation between expansion weight delta and expansion rating?"

### 3. Bulk Export

The `/export` endpoints provide full dataset downloads in machine-friendly formats. Every filter dimension available in the search API is also available in the export API, so you can export "all cooperative games published since 2020 with their player count polls" rather than downloading the entire database.

See [Data Export](./export.md) for format specifications.

## Design Principles

**Transparency.** Every derived value in the API has a documented derivation path back to raw data. If the API returns `best_player_counts: [2, 3]`, you can look at the `PlayerCountPoll` data and verify the derivation yourself.

**Reproducibility.** Given the same raw data and the same algorithm, you should get the same derived values. The specification documents the default derivation algorithms but does not require implementations to use them.

**Exportability.** Data locked in an API is only half-useful. The export system ensures that researchers, analysts, and alternative implementations can work with the full dataset offline.

**Composability.** Export uses the same filter dimensions as search. You do not need a separate query language or data model for analytics.
