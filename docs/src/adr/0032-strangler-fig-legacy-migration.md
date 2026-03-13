---
status: accepted
date: 2026-03-12
---

# ADR-0032: Strangler Fig Pattern for BGG Legacy Migration

## Context and Problem Statement

Many applications currently rely on BoardGameGeek's XML API or web scraping for board game data. Migrating these consumers to the OpenTabletop API must be incremental and low-risk — a "big bang" cutover would break existing integrations and risk data loss. We need a migration strategy that allows gradual, reversible adoption of the new API while maintaining compatibility with existing BGG-based workflows.

## Decision Drivers

* Existing BGG-dependent applications must be able to migrate incrementally, not all-at-once
* BGG IDs must remain usable as lookup keys during and after migration
* The migration must be reversible at every step — no point of no return
* Data imported from BGG must be reconcilable with OpenTabletop's native identifiers

## Considered Options

* Big-bang migration — switch from BGG to OpenTabletop in a single cutover
* Parallel run — operate both systems indefinitely with manual synchronization
* Strangler fig pattern — incrementally route requests through an API gateway translation layer

## Decision Outcome

Chosen option: "Strangler fig pattern with API gateway translation layer", because it enables incremental, reversible migration from BGG data sources to the OpenTabletop API. The pattern works as follows: an API gateway sits in front of the consuming application, translating requests between BGG's format and OpenTabletop's format. Initially, all requests pass through to BGG. Over time, routes are individually switched to the OpenTabletop API as data coverage is confirmed. BGG IDs are stored as cross-references (per ADR-0008), enabling lookups by BGG ID through the OpenTabletop API. At any point, a route can be switched back to BGG if issues are discovered. Big-bang migration was rejected because it is high-risk and irreversible. Indefinite parallel run was rejected because maintaining synchronization between two data sources is operationally expensive and leads to data divergence.

### Consequences

* Good, because migration is incremental — each route can be switched individually based on data readiness
* Good, because BGG ID cross-references enable seamless lookups during the transition period
* Good, because the migration is fully reversible at the route level — any route can fall back to BGG
* Bad, because the API gateway translation layer is additional infrastructure that must be built and maintained
* Bad, because data discrepancies between BGG and OpenTabletop may surface during the migration, requiring reconciliation
