# Pillar 1: Standardized Data Model

The data model is the foundation of OpenTabletop. It defines every entity, relationship, and data type in the specification. The goal is a schema rigorous enough for a relational database, expressive enough to capture the full complexity of board game metadata, and stable enough that implementations can rely on it for years.

## Entity-Relationship Overview

```mermaid
erDiagram
    Game ||--o{ GameRelationship : "source"
    Game ||--o{ GameRelationship : "target"
    Game }o--o{ Mechanic : "has"
    Game }o--o{ Category : "belongs to"
    Game }o--o{ Theme : "themed as"
    Game }o--o{ Family : "part of"
    Game }o--o{ Person : "designed/illustrated by"
    Game }o--o{ Organization : "published by"
    Game ||--o{ PlayerCountPoll : "has votes"
    Game ||--o{ PropertyModification : "modified by"
    Game ||--o{ Identifier : "known as"

    GameRelationship {
        uuid id
        uuid source_game_id
        uuid target_game_id
        enum relationship_type
    }

    Game {
        uuid id
        string slug
        string name
        enum type
        int year_published
        int min_players
        int max_players
        int min_playtime
        int max_playtime
        int community_min_playtime
        int community_max_playtime
        float weight
        float rating
    }

    Person {
        uuid id
        string slug
        string name
        enum role
    }

    Organization {
        uuid id
        string slug
        string name
        enum type
    }

    Mechanic {
        uuid id
        string slug
        string name
    }

    Category {
        uuid id
        string slug
        string name
    }

    Theme {
        uuid id
        string slug
        string name
    }

    Family {
        uuid id
        string slug
        string name
    }

    PlayerCountPoll {
        uuid game_id
        int player_count
        int best_votes
        int recommended_votes
        int not_recommended_votes
    }

    PropertyModification {
        uuid id
        uuid expansion_id
        uuid base_game_id
        string property
        string modification_type
        string value
    }

    Identifier {
        uuid game_id
        string source
        string external_id
    }

    ExpansionCombination {
        uuid id
        uuid base_game_id
        int min_players
        int max_players
        int min_playtime
        int max_playtime
        float weight
    }

    Game ||--o{ ExpansionCombination : "effective with"
    ExpansionCombination }o--o{ Game : "includes expansions"
```

## Entity Summary

| Entity | Description |
|--------|-------------|
| **Game** | The core entity. Represents a base game, expansion, standalone expansion, promo, accessory, or fan expansion. See [Game Entity](./games.md). |
| **GameRelationship** | Typed, directed edges between games: expands, reimplements, contains, requires, recommends, integrates_with. See [Game Relationships](./relationships.md). |
| **PropertyModification** | How a single expansion changes a single property of its base game (e.g., "+2 max players"). See [Property Deltas](./property-deltas.md). |
| **ExpansionCombination** | Pre-computed effective properties for a specific set of expansions combined with a base game. See [Property Deltas](./property-deltas.md). |
| **Mechanic** | A controlled vocabulary term describing a game mechanism (e.g., "deck-building", "worker-placement"). See [Taxonomy](./taxonomy.md). |
| **Category** | A controlled vocabulary term for game classification (e.g., "strategy", "party", "war"). See [Taxonomy](./taxonomy.md). |
| **Theme** | A controlled vocabulary term for thematic setting (e.g., "fantasy", "space", "historical"). See [Taxonomy](./taxonomy.md). |
| **Family** | A named grouping of related games (e.g., "*Catan*", "*Pandemic Legacy*"). See [Taxonomy](./taxonomy.md). |
| **Person** | A designer, artist, or other credited individual. See [People & Organizations](./people.md). |
| **Organization** | A publisher, manufacturer, or distributor. See [People & Organizations](./people.md). |
| **PlayerCountPoll** | Community vote data for each supported player count. See [Player Count Model](./player-count.md). |
| **Identifier** | Cross-reference IDs linking to external systems (BGG, Frosthaven app, etc.). See [Identifiers](./identifiers.md). |

## Design Principles

**Explicit over implicit.** Every relationship is a first-class entity with a type discriminator, not an implied association.

**Dual-source data.** Wherever community perceptions differ from publisher-stated values, both are captured. Publisher-stated play time and community-reported play time are separate fields, not averaged into one. Both sources carry their own biases -- see [Data Provenance & Bias](./data-provenance.md).

**Combinatorial awareness.** The data model does not just store "this expansion exists." It stores how that expansion changes the base game's properties, and it supports pre-computed combinations for sets of expansions. This is what makes [effective mode filtering](../filtering/effective-mode.md) possible.

**Controlled vocabulary with governance.** Mechanics, categories, and themes are not free-text tags. They are managed terms with slugs, definitions, and an RFC process for additions. This prevents the fragmentation problem where "deck building" and "deckbuilding" and "deck-building" are three different tags.

**Stable identifiers.** Every entity has a UUIDv7 (time-sortable, globally unique) and a human-readable slug. External cross-references (BGG IDs, etc.) are stored as structured Identifier entities, not ad-hoc fields.
