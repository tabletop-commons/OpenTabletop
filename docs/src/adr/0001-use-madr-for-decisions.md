---
status: accepted
date: 2026-03-12
---

# ADR-0001: Use MADR 4.0.0 for Architecture Decision Records

## Context and Problem Statement

The OpenTabletop project needs a consistent way to document architectural decisions so that contributors, maintainers, and future developers can understand the reasoning behind key choices. Without a structured format, decision rationale gets lost in chat logs, issue threads, and tribal knowledge. We need a format that is readable, version-controllable, and easy to author.

## Decision Drivers

* Decisions must be easy to write and review in pull requests
* The format should be widely recognized in the open-source community
* Tooling support (linters, templates, generators) is desirable
* Records should be stored alongside the code in version control

## Considered Options

* MADR (Markdown Any Decision Records) 4.0.0
* Nygard format (original ADR format by Michael Nygard)
* Custom format tailored to project needs

## Decision Outcome

Chosen option: "MADR 4.0.0", because it provides a structured yet flexible template that balances thoroughness with ease of authoring. MADR is widely adopted across open-source projects, has strong community support, and includes sections for decision drivers and consequences that the Nygard format lacks. The structured YAML frontmatter enables tooling integration for status tracking and filtering.

### Consequences

* Good, because all decisions follow a consistent, reviewable format
* Good, because MADR's widespread adoption means contributors are likely already familiar with it
* Good, because tooling like adr-tools and log4brains can parse and index MADR records
* Bad, because the template has more sections than the minimal Nygard format, which may feel heavyweight for trivial decisions
