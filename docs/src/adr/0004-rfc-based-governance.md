---
status: accepted
date: 2026-03-12
---

# ADR-0004: RFC-Based Governance with Steering Committee Transition

## Context and Problem Statement

As an open specification project, OpenTabletop needs a governance model that balances rapid early development with long-term community ownership. Specification changes have far-reaching consequences for all implementations, so they require more deliberation than typical code changes. We need a process that is lightweight enough to not stall progress but structured enough to prevent unilateral breaking changes.

## Decision Drivers

* Early-stage projects need fast decision-making to build momentum
* Specification changes affect all downstream implementations and must be deliberated
* The governance model should scale as the contributor base grows
* Transparency and inclusivity are essential for community trust

## Considered Options

* BDFL (Benevolent Dictator for Life) model permanently
* Do-ocracy where whoever does the work decides
* RFC process with transition from BDFL to elected steering committee

## Decision Outcome

Chosen option: "RFC process with BDFL-to-steering-committee transition", because it provides the right governance at each stage of project maturity. Initially, the project founder operates as BDFL to make rapid decisions and set direction. All specification changes go through an RFC process: a written proposal is submitted, discussed in a public thread for a minimum review period, and then decided. Once the project reaches 10 or more active contributors, governance transitions to an elected steering committee of 3-5 members with rotating terms. The RFC process remains constant throughout -- only the decision-making body changes.

### Consequences

* Good, because the RFC process ensures all spec changes are documented and deliberated before adoption
* Good, because the BDFL phase allows fast bootstrapping without governance overhead
* Good, because the transition to elected steering committee ensures long-term community ownership
* Bad, because the RFC process adds latency to specification changes compared to direct commits
* Bad, because the transition threshold (10+ contributors) is somewhat arbitrary and may need adjustment
