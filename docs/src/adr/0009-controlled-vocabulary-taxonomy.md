---
status: accepted
date: 2026-03-12
---

# ADR-0009: Controlled Vocabulary for Taxonomy (Mechanics, Categories, Themes)

## Context and Problem Statement

Board games are classified by mechanics (deck building, worker placement), categories (strategy, party), and themes (fantasy, sci-fi, historical). These taxonomies are critical for filtering and discovery, but inconsistent or uncontrolled tagging leads to fragmentation -- where the same concept has multiple spellings, synonyms, or granularity levels. We need a taxonomy strategy that enables precise, consistent filtering.

## Decision Drivers

* Filtering by mechanic or category must produce consistent, reliable results
* Tag proliferation (e.g., "deck-building" vs "deckbuilding" vs "deck construction") degrades search quality
* New taxonomy terms are needed over time as game design evolves
* The vocabulary should be authoritative enough for data interchange between implementations

## Considered Options

* Free tagging -- anyone can create any tag
* Controlled vocabulary -- curated list of approved terms with an RFC process for additions
* Hybrid -- controlled vocabulary with user-submitted free tags that are periodically reviewed

## Decision Outcome

Chosen option: "Controlled vocabulary with RFC process for new terms", because it prevents the tag fragmentation that plagues free-tagging systems while providing a clear, community-driven path for vocabulary evolution. Each taxonomy term has a canonical slug, display name, and optional description. New terms are proposed through the RFC process (see ADR-0004), discussed publicly, and added only after approval. Synonyms and common misspellings are stored as aliases that map to the canonical term. Free tagging was rejected because it inevitably leads to inconsistent data. The hybrid approach was rejected because the review overhead of triaging free tags is unsustainable.

### Consequences

* Good, because every mechanic, category, and theme has exactly one canonical representation
* Good, because synonym aliases improve data import quality by mapping variant names to canonical terms
* Good, because the RFC process ensures new terms are well-defined and distinct from existing ones
* Bad, because the approval process adds friction when a genuinely new mechanic emerges in game design
* Bad, because the initial vocabulary curation requires significant upfront effort
