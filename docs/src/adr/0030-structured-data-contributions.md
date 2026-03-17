---
status: accepted
date: 2026-03-12
---

# ADR-0030: Structured Data Contributions via Issue Templates

## Context and Problem Statement

The OpenTabletop project's data quality depends on community contributions -- game corrections, new game submissions, and data imports from external sources like BoardGameGeek. We need a contribution workflow that structures incoming data for easy review and verification while being accessible to non-technical contributors who may not be comfortable with pull requests.

## Decision Drivers

* Data contributions must be structured enough to validate and import programmatically
* Non-technical community members should be able to contribute without Git expertise
* Every contribution must be reviewed and verified by a maintainer before entering the dataset
* Bulk imports from external sources (BGG) need admin-level tooling with audit trails

## Considered Options

* Wiki-style open editing with revision history
* Pull request workflow requiring contributors to edit data files directly
* GitHub issue templates for structured data intake with maintainer verification

## Decision Outcome

Chosen option: "GitHub issue templates for structured data intake", because issue templates provide structured forms that guide contributors through the required fields while being accessible to anyone with a GitHub account. Templates are provided for: new game submission, game data correction, new taxonomy term proposal, and bulk import request. Each template collects the required fields in a structured format that maintainers can validate and import. Bulk imports from external sources like BGG use separate admin tooling with audit logging. Wiki-style editing was rejected because unrestricted editing without review leads to data quality degradation. Direct PR workflows were rejected because editing JSON/YAML data files requires technical skills that exclude most community contributors.

### Consequences

* Good, because structured issue templates guide contributors to provide all required information
* Good, because the contribution workflow is accessible to non-technical community members
* Good, because maintainer review ensures data quality before any contribution enters the dataset
* Bad, because the maintainer review step creates a bottleneck that may slow contribution processing
* Bad, because issue templates are less flexible than direct data editing for complex corrections
