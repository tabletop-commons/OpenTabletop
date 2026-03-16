---
status: proposed
date: 2026-03-15
---

# ADR-0042: Game Awards and Recognition

## Context and Problem Statement

Board game awards are a significant factor in purchasing decisions, marketing materials, and game discovery. Awards like the Spiel des Jahres, Kennerspiel des Jahres, Dice Tower Awards, Golden Geek, and International Gamers Award are referenced constantly by publishers, reviewers, and consumers. BGG tracks award nominations and wins per game. The specification currently has no award model, leaving a data gap that matters to every stakeholder: publishers use awards in marketing, designers use them as career milestones, and consumers use them for discovery ("show me all Spiel des Jahres winners").

## Decision Drivers

* Awards are a primary discovery mechanism — "Spiel des Jahres winner" is the most recognized quality signal in the hobby
* Publishers prominently display awards on box art and marketing materials; they need this data to be queryable
* Filtering by award status ("all Kennerspiel winners") is a high-value search use case
* Awards have a stable, well-understood data model: an award, a year, a game, and a result (nominated/won)
* The data is purely additive — no existing schemas need modification beyond adding an optional include array

## Considered Options

* **Dedicated Award and GameAward schemas** — Full entity modeling with endpoints for awards and per-game award listings
* **Tags/labels on Game entity** — Simple string array of award labels (e.g., ["spiel-des-jahres-2020-nominee"])
* **Defer to v2** — Awards are metadata, not structural; implement later

## Decision Outcome

Chosen option: "Dedicated Award and GameAward schemas," because awards are a distinct domain with their own lifecycle (new awards are created, results are announced annually) and query patterns (filter by award, list all winners of an award, see a game's awards). A tag/label approach loses the structured year and result data needed for temporal queries ("who won in 2020?") and loses the ability to list all nominees for a given award year. Deferral was rejected because awards are a top-3 publisher and consumer expectation for a complete game database.

### Consequences

* Good, because awards become a first-class queryable dimension — "show me all Spiel des Jahres winners from 2015-2025"
* Good, because the data model naturally represents the award lifecycle (nomination → shortlist → win)
* Good, because publishers can reference award status in their data submissions
* Good, because award filtering composes with existing filter dimensions (all Kennerspiel winners that play well at 2)
* Bad, because the initial award taxonomy must be seeded — there are dozens of recognized board game awards worldwide
* Bad, because award categorization is complex — the Spiel des Jahres family has three sub-awards (SdJ, Kennerspiel, Kinderspiel), the Dice Tower has multiple categories, etc.

## Implementation

### New Schemas

**`spec/schemas/Award.yaml`** — An award or award family:
- `id` (UUID, required)
- `slug` (string, required) — e.g., "spiel-des-jahres"
- `name` (string, required) — e.g., "Spiel des Jahres"
- `description` (string)
- `organization` (string) — e.g., "Verein Spiel des Jahres"
- `website` (URI)
- `_links` (Links)

**`spec/schemas/GameAward.yaml`** — A game's relationship to an award:
- `game_id` (UUID, required)
- `award_id` (UUID, required)
- `year` (integer, required) — The award cycle year
- `result` (enum, required): `nominated`, `shortlisted`, `recommended`, `won`
- `category` (string, nullable) — Specific track within the award family (e.g., "Kennerspiel des Jahres")
- `_links` (Links)

### New Endpoints

- **`GET /awards`** — List all awards (paginated)
- **`GET /awards/{id}`** — Single award detail
- **`GET /games/{id}/awards`** — Awards for a specific game

### Game Schema Changes

Add `awards` array to `Game.yaml` (GameAward items), included via `?include=awards`.

### Include Parameter

Add `awards` to the include parameter in `spec/parameters/include.yaml`.

### Search Integration

Add optional `award` filter to `SearchFilters` for filtering games by award slug and/or result (e.g., `award.slug=spiel-des-jahres&award.result=won`).

### BGG Migration Mapping

BGG stores awards as family links with type "boardgamehonor". Each honor entry maps to a `GameAward` record. The award family (e.g., "Spiel des Jahres") maps to an `Award` entity. The specific honor text must be parsed to extract year, result (nominee vs winner), and category.
