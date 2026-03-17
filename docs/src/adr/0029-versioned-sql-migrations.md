---
status: accepted
date: 2026-03-12
---

# ADR-0029: Versioned Plain SQL Migration Files

## Context and Problem Statement

The database schema must evolve over time as the API specification grows. Schema changes need to be versioned, reproducible, and applicable in a consistent order across all environments. The migration tooling choice also has implications for implementation portability -- migrations tightly coupled to an ORM lock downstream implementations into that ORM's ecosystem.

## Decision Drivers

* Migrations must be tool-agnostic so that any implementation (Rust, Python, Go) can apply them
* Each migration must be versioned and applied in deterministic order
* Migrations must be reviewable as plain SQL in pull requests
* The migration format should not assume a specific ORM or framework

## Considered Options

* ORM-generated migrations (e.g., Diesel migrations, Alembic, Django migrations)
* Plain SQL migration files with sequential numbering
* Schema-as-code (e.g., Atlas, Skeema) with declarative schema definitions

## Decision Outcome

Chosen option: "Plain SQL migration files", because SQL is the universal language understood by every database tool and every implementation language. Migration files follow the naming convention `NNNN_description.sql` (e.g., `0001_create_games_table.sql`, `0002_add_player_count_polls.sql`). Each file contains the forward migration SQL. The migration runner tracks applied migrations in a `schema_migrations` table. Any implementation can apply these migrations using its language's database driver or a standalone tool like `psql`. ORM migrations were rejected because they lock the migration format to a specific ORM and language. Schema-as-code was rejected because declarative approaches can produce surprising migration plans for complex schema changes.

### Consequences

* Good, because any implementation in any language can apply the same SQL migration files
* Good, because SQL migrations are directly reviewable in pull requests without ORM translation
* Good, because the `schema_migrations` tracking table is a simple, universal pattern
* Bad, because plain SQL migrations lack the automatic rollback generation that some ORMs provide
* Bad, because complex data migrations may require more verbose SQL than an ORM's DSL would need
