---
status: accepted
date: 2026-03-12
---

# ADR-0018: HAL-Style Hypermedia Links for Discoverability

## Context and Problem Statement

A well-designed REST API should be discoverable — clients should be able to navigate the API by following links in responses rather than constructing URLs from documentation. However, full HATEOAS (Hypermedia as the Engine of Application State) adds significant complexity with marginal benefit for most API consumers. We need a pragmatic level of hypermedia support that aids discoverability without over-engineering.

## Decision Drivers

* Responses should include links to related resources and pagination endpoints
* The link format should be a recognized standard, not a custom invention
* Full HATEOAS state machine semantics are overkill for a data-oriented API
* Links must be useful for both human developers exploring the API and automated clients

## Considered Options

* No hypermedia links — clients construct URLs from documentation
* HAL (Hypertext Application Language) format links
* JSON:API links format
* Full HATEOAS with state transitions and actions

## Decision Outcome

Chosen option: "HAL-style links (HAL-lite)", because HAL's `_links` object is simple, well-understood, and provides the right level of discoverability without the complexity of full HATEOAS. Every response includes a `_links` object containing at minimum a `self` link. Collection responses include `next` and `prev` pagination links when applicable. Resource responses include links to related resources (e.g., `expansions`, `designers`, `mechanics`). We adopt HAL's link format (`href` property) without the full HAL specification (no `_embedded`, no link relations registry, no CURIEs). JSON:API was rejected because it imposes a full response envelope format that constrains our schema design. Full HATEOAS was rejected because state machine semantics add complexity that data API consumers do not need.

### Consequences

* Good, because developers can explore the API by following links in responses
* Good, because HAL's `_links` format is widely recognized and trivially parseable
* Good, because pagination links eliminate the need for clients to construct cursor URLs manually
* Bad, because HAL-lite is not a formal specification, so the exact link behavior must be documented
* Bad, because including `_links` in every response adds payload overhead, even when clients ignore them
