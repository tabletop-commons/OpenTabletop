---
status: superseded by [ADR-0045](0045-specification-only-repository.md)
date: 2026-03-12
---

# ADR-0031: RFC Changes Require Reference Implementation

## Context and Problem Statement

Specification changes that look reasonable on paper can prove impractical or ambiguous when actually implemented. Spec drift -- where the specification diverges from what implementations can realistically support -- is a common failure mode of API standards projects. We need a process that grounds every specification change in real, working code.

## Decision Drivers

* Specification changes must be proven implementable before adoption
* The reference implementation must always be in sync with the current spec version
* The process must prevent spec drift without requiring every implementation to update simultaneously
* SDK updates should be tracked alongside specification changes

## Considered Options

* Spec-only changes are allowed -- implementations catch up later
* Every spec change requires at least one reference implementation PR
* Every spec change requires all implementations (server + all SDKs) to be updated simultaneously

## Decision Outcome

Chosen option: "Every spec change requires one reference implementation PR plus SDK update tracking", because it ensures every specification change is proven implementable without creating an unsustainable requirement for simultaneous multi-language updates. The process is: (1) submit an RFC for the spec change (per ADR-0004), (2) during the RFC review period, prepare a reference server implementation PR that demonstrates the change, (3) the spec RFC and reference implementation PR are merged together, (4) SDK update issues are automatically created for each SDK to track the update. This ensures the spec is always grounded in working code while giving SDK maintainers a reasonable window to catch up. Spec-only changes were rejected because they inevitably lead to spec drift. Requiring all implementations was rejected because it creates an unrealistic bottleneck that would slow spec evolution to a crawl.

### Consequences

* Good, because every specification change is proven implementable by working code before adoption
* Good, because the reference server always reflects the current specification
* Good, because SDK update tracking ensures language bindings eventually catch up without blocking spec evolution
* Bad, because requiring a reference implementation PR adds effort and time to every spec change
* Bad, because the reference implementation is in Rust, which means the spec is only proven implementable in one language
