---
status: accepted
date: 2026-03-17
supersedes:
  - ADR-0025
  - ADR-0026
  - ADR-0031
---

# ADR-0045: Specification-Only Repository

## Context and Problem Statement

The OpenTabletop repository was structured as if it would ship a reference server implementation (Rust/Axum/SQLx), generated client SDKs (Rust, Python, JavaScript), and container images. In practice, these directories contain placeholder stubs -- 34 lines of SDK code and 95 lines of server TODOs. The presence of implementation artifacts creates a misleading impression that the project is building a product rather than defining a standard. It also creates maintenance burden (dependabot PRs for unused dependencies, CI workflows building empty binaries) and confuses the contribution model (ADR-0031 required every spec change to include a reference implementation update).

OpenTabletop's core value is as a **standard and commons** -- an OpenAPI specification, controlled vocabularies, sample data, and documentation that anyone can use to build their own conforming implementation. The repository should reflect this identity.

## Decision Drivers

* The project's primary deliverables are schemas, vocabularies, and documentation -- not executable code
* Placeholder implementation directories create false expectations and attract dependency churn (10 dependabot PRs for unused packages)
* Requiring reference implementation updates with every spec change (ADR-0031) blocks spec-only contributors
* Implementation guidance (twelve-factor, observability, container patterns) remains valuable as recommendations for implementers -- it should be retained as documentation, not deleted

## Considered Options

* **Keep the current structure** -- maintain placeholder sdks/ and reference/ directories as scaffolding for future implementation
* **Specification-only repository** -- remove implementation artifacts, retain implementation ADRs as guidance, add sample data
* **Separate repositories** -- move implementation to a separate repo (e.g., opentabletop-server) while keeping spec here

## Decision Outcome

Chosen option: "Specification-only repository", because the project's identity is a standard, not a product. Implementation code belongs in adopters' repositories, not in the specification repository. This aligns with how other successful API standards operate (OpenAPI itself, JSON Schema, CloudEvents).

### What This Repository Provides

* **OpenAPI 3.1 specification** (`spec/`) -- the canonical API contract
* **Controlled vocabularies** (`data/taxonomy/`) -- curated mechanics, categories, and themes
* **BGG bridge mappings** (`data/mappings/`) -- migration path from BoardGameGeek
* **Sample data** (`data/samples/`) -- demonstration records conforming to the schemas
* **Documentation** (`docs/`) -- ADRs, pillar documentation, implementer guides
* **Tooling** (`tools/`, `scripts/`) -- taxonomy viewer, spec bundling, ADR validation

### What This Repository Does Not Provide

* Server implementations (any language/framework)
* Client SDKs (generate from the OpenAPI spec using standard tooling)
* Container images (build from your own implementation)
* Hosted API instances

### Superseded Decisions

* **ADR-0025** (Rust with Axum and SQLx for the Reference Server) -- The technology recommendation remains valid guidance for implementers but is no longer a project commitment. The `reference/` directory is removed.
* **ADR-0026** (OpenAPI Generator for SDK Generation) -- Implementers are encouraged to generate SDKs from the spec, but the project no longer ships or maintains generated SDKs. The `sdks/` directory is removed.
* **ADR-0031** (RFC Changes Require Reference Implementation) -- Spec changes no longer require a reference implementation update. The contribution workflow is: RFC discussion, community review, steering committee vote, PR with spec change and updated documentation.

### Implementation ADRs Retained as Guidance

ADRs 0020-0024, 0027, 0029, and 0032 document recommended patterns for building conforming servers (twelve-factor design, container images, observability, database design, migration strategies). These are retained as implementer guidance in the ADR index, clearly labeled as recommendations rather than requirements of the standard.

### Consequences

* Good, because the repository accurately reflects its purpose as a specification and commons
* Good, because contributors can work on the spec without needing Rust/Python/JavaScript toolchains
* Good, because dependabot and CI no longer churn on unused implementation dependencies
* Good, because the contribution model is simpler -- spec changes need spec + docs, not code in three languages
* Neutral, because implementers lose a reference server to test against -- but the existing reference server was non-functional (all TODOs)
* Bad, because there is no longer a canonical "this is how you build it" implementation -- implementers must rely on the spec, documentation, and sample data
* Bad, because future protobuf/gRPC definitions are not yet included -- this is noted as a future consideration

### Future Considerations

* **Protobuf definitions** -- `.proto` files alongside the OpenAPI spec would enable gRPC-based implementations. These can be added when there is concrete demand.
* **Conformance test suite** -- A language-agnostic test suite that validates any implementation against the spec would partially replace the reference server's role as a conformance target.
* **Community implementations** -- The README and documentation should link to known community implementations as they emerge.
