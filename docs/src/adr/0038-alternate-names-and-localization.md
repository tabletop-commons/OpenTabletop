---
status: proposed
date: 2026-03-15
---

# ADR-0038: Alternate Names and Localization Support

## Context and Problem Statement

The Game entity currently has a single `name` field and a `sort_name` field. Board games are published internationally under different names — Brass: Birmingham has alternate names in Russian (Brass. Бирмингем), Ukrainian (Brass. Бірмінгем), Japanese (ブラス：バーミンガム), Chinese (工业革命：伯明翰), and Korean (브라스: 버밍엄). Without alternate name storage, these names are invisible to search, making the API unusable for non-English discovery. BGG tracks alternate names per game; OpenTabletop must do the same to support international adoption and BGG migration ([ADR-0032](0032-strangler-fig-legacy-migration.md)).

## Decision Drivers

* International editions have localized names that users search by — a Japanese user searches "ブラス：バーミンガム", not "Brass: Birmingham"
* Full-text search ([ADR-0027](0027-postgresql-fulltext-search.md)) currently indexes only `name` and `sort_name`, missing all localized names
* BGG migration requires importing alternate names to maintain search parity
* Game editions ([ADR-0035](0035-edition-level-property-deltas.md)) relate to localized names but serve a different purpose — edition names identify products, alternate names identify the game itself
* The change is small (one new schema, one new array field) with outsized impact on global usability

## Considered Options

* **Array of strings on Game** — Simple `alternate_names: string[]` with no metadata
* **Structured AlternateName schema with language and source** — Each alternate name carries a BCP 47 language tag, primary flag, and source attribution
* **Derive alternate names from editions** — Use `GameEdition.name` as the source of localized names, no separate storage

## Decision Outcome

Chosen option: "Structured AlternateName schema," because language tags enable language-specific search indexing (e.g., Japanese tokenizer for Japanese names) and source attribution supports data provenance tracking. A flat string array loses the language signal that search depends on. Deriving from editions was rejected because alternate names and edition names serve different purposes — an edition name like "Brass: Birmingham — Czech edition 2025" is a product identifier, while the alternate name "Brass. Бірмінгем" is what users search for.

### Consequences

* Good, because non-English users can discover games by their localized names
* Good, because full-text search can use language-appropriate tokenizers per alternate name
* Good, because BGG alternate names import directly into this schema
* Good, because source attribution tracks whether a name came from BGG, a publisher, or the community
* Bad, because alternate names may duplicate information already present in edition names — the boundary between the two should be documented clearly
* Bad, because deduplication across sources (same name from BGG and from a publisher submission) requires implementation-level logic

## Implementation

### New Schema

`spec/schemas/AlternateName.yaml` — A structured alternate name entry with language metadata.

Fields:
- `name` (string, required) — The alternate name
- `language` (string, nullable) — BCP 47 language tag (e.g., "ja", "zh-Hans", "ko")
- `is_primary` (boolean, default false) — Whether this is the primary name in its language
- `source` (string, nullable) — Data source ("bgg", "publisher", "community")

### Game Schema Changes

Add `alternate_names` array to `Game.yaml`, included via `?include=alternate_names`.

### Include Parameter

Add `alternate_names` to the list of available include values in `spec/parameters/include.yaml`.

### Search Integration

Alternate names should be indexed for full-text search ([ADR-0027](0027-postgresql-fulltext-search.md)) with language-appropriate analyzers where available.

### BGG Migration Mapping

BGG `<name type="alternate">` elements map directly to `AlternateName` entries. The BGG `type="primary"` name maps to `Game.name`; all `type="alternate"` names become `AlternateName` entries with `source: "bgg"`. Language tags must be inferred from the edition language or detected algorithmically — BGG does not store language metadata on alternate names.
