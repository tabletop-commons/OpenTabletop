# Property Deltas & Combinations

Expansions do not just add content — they change the *properties* of the base game. Branch & Claw does not just add spirits to Spirit Island; it increases the recommended play time, nudges the complexity weight upward, and can alter the effective player count when combined with other expansions. The property delta system captures these changes as structured, queryable data.

This is what makes [effective mode filtering](../filtering/effective-mode.md) possible. Without it, you could only filter games by their base properties. With it, you can ask "what games support 6 players when I include expansions?" and get answers.

## Three Layers of Data

### Layer 0: Edition Deltas

Before expansion deltas are considered, the system accounts for *edition differences*. The same game may exist in multiple printings or editions — a revised edition might change the player count, adjust component counts that affect play time, or rebalance mechanics that shift the complexity weight. Edition deltas capture these differences relative to the **canonical edition** (the reference edition whose properties match the Game entity's top-level values).

Key properties of edition deltas:

- **Applied before expansion deltas** in the resolution pipeline. The edition provides the adjusted base that expansions then modify.
- **One edition at a time** — unlike expansions, there is no combinatorial explosion. A game session uses exactly one edition.
- **Deltas are relative to the canonical edition.** If the 2017 first printing is canonical and the 2020 revised edition changes max play time from 120 to 90 minutes, the delta is -30 minutes.
- **Optional.** Many games have only one edition or no tracked edition differences. When no edition data exists, the canonical (top-level) properties are used directly.

The `is_canonical` flag on `GameEdition` marks which edition's properties match the Game entity's top-level values. The `EditionDelta` schema captures the property differences for non-canonical editions. See [ADR-0035](../../adr/0035-edition-level-property-deltas.md) for the full design rationale.

### Layer 1: PropertyModification (Individual Deltas)

A `PropertyModification` records how a *single expansion* changes a *single property* of its base game.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUIDv7 | yes | Primary identifier |
| `expansion_id` | UUIDv7 | yes | The expansion that causes this change |
| `base_game_id` | UUIDv7 | yes | The base game being modified |
| `property` | string | yes | Which property is changed (e.g., `max_players`, `weight`, `max_playtime`) |
| `modification_type` | enum | yes | How the property is changed: `set`, `add`, `multiply` |
| `value` | string | yes | The new value or delta (interpreted based on modification_type) |

**Modification types:**

- `set` — Replace the property value entirely. "Max players becomes 6."
- `add` — Add to the existing value. "Max playtime increases by 30 minutes."
- `multiply` — Multiply the existing value. Used rarely, mainly for scaling factors.

### Layer 2: ExpansionCombination (Expansion Set-Level Effects)

An `ExpansionCombination` records the *effective properties* when a specific set of expansions is combined with a base game. This handles non-linear interactions: adding Branch & Claw and Jagged Earth together does not simply stack their individual deltas. The combination has its own tested, community-verified properties.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUIDv7 | yes | Primary identifier |
| `base_game_id` | UUIDv7 | yes | The base game |
| `expansion_ids` | UUIDv7[] | yes | The set of expansions included (order irrelevant) |
| `min_players` | integer | no | Effective minimum player count |
| `max_players` | integer | no | Effective maximum player count |
| `min_playtime` | integer | no | Effective minimum play time |
| `max_playtime` | integer | no | Effective maximum play time |
| `weight` | float | no | Effective complexity weight |
| `best_at` | integer[] | no | Player counts where this combination is best |
| `recommended_at` | integer[] | no | Player counts where this combination is recommended |

## Three-Tier Resolution

When the system needs to determine the effective properties of a base game with a set of expansions, it follows a three-tier resolution strategy:

```mermaid
flowchart TD
    Q["Query: Spirit Island + Branch & Claw + Jagged Earth"]
    T1{"Explicit<br/>ExpansionCombination<br/>exists?"}
    T2{"Individual<br/>PropertyModifications<br/>exist?"}
    T3["Fall back to<br/>base game properties"]

    Q --> T1
    T1 -->|Yes| R1["Use ExpansionCombination<br/>properties directly"]
    T1 -->|No| T2
    T2 -->|Yes| R2["Apply delta sum:<br/>base + sum of deltas"]
    T2 -->|No| T3

    R1 -.- N1["Highest confidence.<br/>Community-verified data<br/>for this exact combo."]
    R2 -.- N2["Medium confidence.<br/>Assumes deltas stack<br/>linearly."]
    T3 -.- N3["Lowest confidence.<br/>Expansion effects<br/>unknown."]

    style R1 fill:#388e3c,color:#fff
    style R2 fill:#f57c00,color:#fff
    style T3 fill:#d32f2f,color:#fff
```

**Tier 1: Explicit combination.** If an `ExpansionCombination` record exists for exactly this set of expansions with this base game, use its properties. This is the most accurate: someone has verified "Spirit Island + B&C + JE supports 1-6 players at weight 4.2."

**Tier 2: Delta sum.** If no explicit combination exists but individual `PropertyModification` records exist for each expansion, sum the deltas. For `set` modifications, the last one wins (by expansion release date). For `add` modifications, sum the values. This is a reasonable approximation but may not capture non-linear interactions.

**Tier 3: Base fallback.** If no modification data exists at all, use the base game's properties unchanged. The expansion's effects are simply unknown.

The API response includes a `resolution_tier` field so consumers know the confidence level of the effective properties they received.

## Spirit Island: Full Worked Example

Here is the complete property delta data for Spirit Island and its major expansions:

### Base Game Properties

| Property | Value |
|----------|-------|
| min_players | 1 |
| max_players | 4 |
| best_at | [2] |
| recommended_at | [1, 2, 3] |
| weight | 3.89 |
| min_playtime | 90 |
| max_playtime | 120 |

### Individual PropertyModifications

**Branch & Claw:**

| Property | Type | Value | Effect |
|----------|------|-------|--------|
| weight | set | 4.05 | Weight increases to 4.05 (more complex events) |
| max_playtime | set | 150 | Play time extends to 90-150 min |

**Jagged Earth:**

| Property | Type | Value | Effect |
|----------|------|-------|--------|
| max_players | set | 6 | Now supports up to 6 players |
| weight | set | 4.10 | Weight increases to 4.10 |
| max_playtime | set | 150 | Play time extends to 90-150 min |

### ExpansionCombinations (Explicit)

**Spirit Island + Branch & Claw:**

| Property | Value |
|----------|-------|
| min_players | 1 |
| max_players | 4 |
| best_at | [2] |
| recommended_at | [1, 2, 3] |
| weight | 4.05 |
| min_playtime | 90 |
| max_playtime | 150 |

**Spirit Island + Jagged Earth:**

| Property | Value |
|----------|-------|
| min_players | 1 |
| max_players | 6 |
| best_at | [2, 3] |
| recommended_at | [1, 2, 3, 4] |
| weight | 4.10 |
| min_playtime | 90 |
| max_playtime | 150 |

**Spirit Island + Branch & Claw + Jagged Earth:**

| Property | Value |
|----------|-------|
| min_players | 1 |
| max_players | 6 |
| best_at | [2, 3, 4] |
| recommended_at | [1, 2, 3, 4, 5] |
| weight | 4.20 |
| min_playtime | 120 |
| max_playtime | 180 |

Notice how the combination of both expansions produces different results than either alone. The `best_at` list expands to include 4 players — something neither expansion achieves individually. The minimum play time increases to 120 minutes, reflecting the added setup time when using both together. The weight jumps to 4.20, higher than either expansion alone. These non-linear effects are why explicit `ExpansionCombination` records exist.

### Resolution in Action

If someone queries "Spirit Island + Branch & Claw + Jagged Earth + Nature Incarnate":

1. Check for an explicit `ExpansionCombination` with exactly `{B&C, JE, NI}`. If it exists (say with weight 4.35, 1-6 players, 120-180 min), use it. **Tier 1.**
2. If not, check for individual `PropertyModification` records for Nature Incarnate and combine with the `{B&C, JE}` combination. **Tier 2.**
3. If Nature Incarnate has no property modifications recorded at all, return the `{B&C, JE}` combination properties as the best available approximation. **Tier 3** for NI's effects.

## Data Quality

Property delta data is community-contributed and curated. The specification defines the schema; the data itself comes from:

- Publisher information (max player count with an expansion is often printed on the box)
- Community play reports (play time with expansions)
- Community voting (weight with expansions)
- Curator verification (explicit combination records reviewed by maintainers)

The `resolution_tier` field in API responses provides transparency about data quality, letting consumers decide how much to trust effective-mode results.
