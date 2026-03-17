---
status: superseded by [ADR-0045](0045-specification-only-repository.md)
date: 2026-03-12
---

# ADR-0026: OpenAPI Generator for SDK Generation

## Context and Problem Statement

The OpenTabletop API should be easy to consume from multiple programming languages. Providing official SDKs lowers the barrier to adoption, but hand-writing and maintaining SDKs for multiple languages is expensive and error-prone -- especially when the specification evolves. We need an SDK strategy that keeps SDKs in sync with the spec while allowing ergonomic customization.

## Decision Drivers

* SDKs must stay in sync with the OpenAPI specification as it evolves
* Initial SDK generation must be automated to reduce maintenance burden
* Generated code should be ergonomic and idiomatic for each target language
* The SDK toolchain must support Rust, Python, and JavaScript/TypeScript as priority targets

## Considered Options

* Hand-written SDKs maintained independently per language
* openapi-generator for automated SDK generation with hand-tuned ergonomic wrappers
* swagger-codegen for automated SDK generation

## Decision Outcome

Chosen option: "openapi-generator as starting point, hand-tuned for ergonomics", because it provides automated generation from the canonical OpenAPI spec while allowing idiomatic adjustments per language. The generation pipeline produces: Rust SDK (using reqwest as HTTP client), Python SDK (using httpx for async HTTP and Pydantic for models), and JavaScript/TypeScript SDK (using the native fetch API with full type definitions). Generated code is committed to the repository and treated as a starting point -- maintainers may hand-tune method signatures, error handling, and documentation for better developer experience. Each SDK's CI pipeline regenerates from the spec and flags any diff as a review item. swagger-codegen was rejected because openapi-generator is the actively maintained community fork with broader language support and more frequent updates. Hand-written SDKs were rejected because maintaining them across three languages as the spec evolves is unsustainable.

### Consequences

* Good, because SDK generation from the spec ensures structural consistency across all languages
* Good, because hand-tuning allows idiomatic APIs (e.g., Python async context managers, Rust builder patterns)
* Good, because CI-based regeneration detects when SDKs drift from the spec
* Bad, because generated code can be verbose and may not follow each language's best practices without tuning
* Bad, because openapi-generator's output quality varies by language, with some targets requiring more hand-tuning than others
