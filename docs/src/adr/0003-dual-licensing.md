---
status: accepted
date: 2026-03-12
---

# ADR-0003: Dual Licensing -- Apache 2.0 for Code, CC-BY-4.0 for Spec

## Context and Problem Statement

The OpenTabletop project consists of two distinct artifacts: the API specification (OpenAPI document, ADRs, documentation) and the reference implementation code (server, SDKs, tooling). These artifacts have different usage patterns and different intellectual property concerns. The specification is meant to be adopted and implemented by anyone, while the code benefits from patent protections. We need a licensing strategy that encourages adoption while protecting contributors.

## Decision Drivers

* The specification must be freely implementable by anyone without patent concerns
* Code contributions need patent grant protection for contributors and users
* The model should be familiar to the open-source community and easy to understand
* Attribution should be required for the specification to credit the community

## Considered Options

* MIT License for everything
* Apache License 2.0 for everything
* Dual license: Apache 2.0 for code, CC-BY-4.0 for specification and documentation

## Decision Outcome

Chosen option: "Dual license -- Apache 2.0 for code, CC-BY-4.0 for spec", because this mirrors the approach used by the OpenAPI Initiative and provides the best fit for each artifact type. Apache 2.0 includes an explicit patent grant that protects contributors and users of the code, which MIT lacks. CC-BY-4.0 is the standard license for creative and specification works, requiring attribution while allowing free use and adaptation. MIT was rejected because it lacks patent protection, and using Apache 2.0 alone would be awkward for non-code specification documents.

### Consequences

* Good, because Apache 2.0's patent grant protects all code contributors and downstream users
* Good, because CC-BY-4.0 allows anyone to implement the spec while requiring attribution to the OpenTabletop project
* Good, because this dual model is well-understood, following the OpenAPI Initiative precedent
* Bad, because contributors must understand two licenses and which applies to their contribution
* Bad, because dual licensing adds complexity to the CONTRIBUTING guide and requires clear file-level boundaries
