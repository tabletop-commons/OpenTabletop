# Taxonomy

Board game metadata relies on three classification vocabularies: **mechanics**, **categories**, and **themes**. These are controlled vocabularies — curated lists of terms with stable identifiers, not free-text tags. A game is tagged with zero or more entries from each vocabulary through many-to-many join relationships.

## Why Controlled Vocabularies

The board game community has a fragmentation problem. "Deck building" and "deckbuilding" and "deck-building" and "Deck Building" are four different tags on various platforms, all meaning the same thing. Free-text tagging guarantees this kind of drift. Controlled vocabularies prevent it by defining each term exactly once with a canonical slug.

Every taxonomy term has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUIDv7 | Primary identifier |
| `slug` | string | URL-safe canonical name (e.g., `deck-building`) |
| `name` | string | Human-readable display name (e.g., "Deck Building") |
| `description` | string | Definition of what this term means |
| `parent_id` | UUIDv7 | Optional parent for hierarchical terms |

## Mechanics

A mechanic describes *how you interact with the game* — the systems and structures that create the gameplay experience. These are objective, observable features of a game's design.

**Examples:**

| Slug | Name | Description |
|------|------|-------------|
| `deck-building` | Deck Building | Players construct their own play deck during the game |
| `worker-placement` | Worker Placement | Players assign tokens to limited action spaces |
| `area-control` | Area Control | Players compete for dominance over map regions |
| `cooperative` | Cooperative | All players work together against the game system |
| `dice-rolling` | Dice Rolling | Random outcomes determined by dice |
| `hand-management` | Hand Management | Strategic decisions about which cards to play, hold, or discard |
| `drafting` | Drafting | Players select items from a shared pool in turn order |
| `engine-building` | Engine Building | Players construct systems that generate increasing returns |
| `hidden-roles` | Hidden Roles | Players have secret identities affecting their objectives |
| `trick-taking` | Trick Taking | Players play cards to win rounds based on rank and suit rules |

Mechanics can be hierarchical. `deck-building` might have children like `pool-building` (a variant using tokens instead of cards) and `bag-building` (drawing from a bag instead of a deck).

## Categories

A category describes *what kind of experience the game provides* — its genre classification. Categories are more subjective than mechanics but still follow defined criteria.

**Examples:**

| Slug | Name | Description |
|------|------|-------------|
| `strategy` | Strategy | Emphasis on long-term planning and tactical decisions |
| `party` | Party | Designed for large groups with social interaction focus |
| `family` | Family | Accessible rules suitable for mixed-age groups |
| `war` | Wargame | Simulates military conflict with detailed combat systems |
| `abstract` | Abstract | No theme; pure mechanical interaction (e.g., Chess, Go) |
| `thematic` | Thematic | Theme is deeply integrated into mechanics and narrative |
| `economic` | Economic | Focuses on resource management, trading, and market dynamics |
| `puzzle` | Puzzle | Players solve logical challenges |
| `dexterity` | Dexterity | Requires physical skill (flicking, stacking, balancing) |
| `legacy` | Legacy | Game state permanently changes across sessions |

## Themes

A theme describes *the setting or subject matter* of the game — its narrative and aesthetic wrapper. Themes are the most subjective vocabulary but still benefit from controlled terms.

**Examples:**

| Slug | Name | Description |
|------|------|-------------|
| `fantasy` | Fantasy | Magic, mythical creatures, medieval-inspired settings |
| `space` | Space | Outer space, space exploration, science fiction |
| `historical` | Historical | Based on real historical events or periods |
| `horror` | Horror | Dark, frightening, or supernatural themes |
| `nature` | Nature | Wildlife, ecology, natural environments |
| `civilization` | Civilization | Building and managing societies across eras |
| `pirates` | Pirates | Seafaring, piracy, naval adventure |
| `trains` | Trains | Rail networks, train operations, railway building |
| `mythology` | Mythology | Based on mythological traditions (Greek, Norse, etc.) |
| `post-apocalyptic` | Post-Apocalyptic | Survival in a world after societal collapse |

## Families

A **family** groups games that share a brand, universe, or lineage but are not necessarily related by `GameRelationship` edges. Families are looser than relationships — they capture "these games are part of the same franchise" without implying mechanical dependency.

**Examples:**

| Slug | Name | Description |
|------|------|-------------|
| `catan` | Catan | All games in the Catan universe |
| `pandemic` | Pandemic | All Pandemic variants and legacy editions |
| `ticket-to-ride` | Ticket to Ride | All Ticket to Ride maps and editions |
| `exit-the-game` | EXIT: The Game | The EXIT series of escape room games |
| `18xx` | 18xx | The family of railroad stock-trading games |

A game can belong to multiple families. *Pandemic Legacy: Season 1* belongs to both `pandemic` and `legacy-games`.

## RFC Process for New Terms

Adding a new mechanic, category, or theme is a specification change. It follows the RFC governance process:

1. **Proposal.** A contributor submits an RFC with the proposed term, slug, name, description, and justification. The RFC must explain why the term is not covered by existing vocabulary and provide at least three published games that would use it.

2. **Discussion.** The RFC is open for community comment for a minimum of 14 days. Feedback focuses on whether the term is distinct enough, whether the name is clear, and whether the proposed slug follows conventions.

3. **Decision.** The BDFL (or steering committee, after transition) approves, requests changes, or rejects the RFC. Approved terms are added to the next minor version of the specification.

4. **Aliasing.** If an existing term is found to be ambiguous or too broad, it can be deprecated and split into more specific terms. The old slug becomes an alias that maps to the new terms, preserving backward compatibility.

### Slug Conventions

- Lowercase, hyphen-separated: `deck-building`, not `deckBuilding` or `deck_building`
- Use the most common English term: `cooperative`, not `co-operative`
- Avoid abbreviations unless universally understood: `rpg` is acceptable, `wrkr-plcmnt` is not
- Maximum 50 characters
