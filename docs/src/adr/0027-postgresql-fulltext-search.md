---
status: accepted
date: 2026-03-12
---

# ADR-0027: PostgreSQL Full-Text Search

## Context and Problem Statement

The OpenTabletop API needs search functionality for finding games by name, description, designer, and other text fields. Search must support relevance ranking and ideally handle common misspellings. We need a search solution that balances capability with operational simplicity -- adding a separate search service increases infrastructure complexity significantly.

## Decision Drivers

* Search must support relevance-ranked results across multiple weighted fields
* Operational simplicity -- minimizing the number of infrastructure components to operate
* The solution should work with the existing PostgreSQL database to avoid additional services
* Typo tolerance and fuzzy matching are desirable but not strictly required in v1

## Considered Options

* Elasticsearch for full-featured search with fuzzy matching and faceting
* Meilisearch for typo-tolerant, easy-to-deploy search
* PostgreSQL native full-text search with tsvector

## Decision Outcome

Chosen option: "PostgreSQL tsvector full-text search", because it provides relevance-ranked search directly within the existing database without any additional infrastructure. A `search_vector` tsvector column is maintained via trigger, with weighted components: game name at weight A (highest), description at weight B, and designer names at weight C (lowest). The `ts_rank` function provides relevance scoring. A GIN index on the tsvector column ensures search queries are fast. This eliminates the need to synchronize data between the primary database and a separate search index. Meilisearch is documented in the deployment guide as an optional enhancement for operators who need typo tolerance and instant search -- the API contract remains the same regardless of the search backend. Elasticsearch was rejected because its operational overhead (JVM, cluster management, index synchronization) is disproportionate to the project's search requirements.

### Consequences

* Good, because no additional infrastructure is required -- search runs in the existing PostgreSQL instance
* Good, because weighted search ranking (name > description > designer) provides relevant results
* Good, because GIN-indexed tsvector queries are fast even on large datasets
* Bad, because PostgreSQL's full-text search lacks typo tolerance and fuzzy matching out of the box
* Bad, because the search_vector column must be kept in sync via triggers, adding write-path complexity
