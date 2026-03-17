# Implementing the Spec

OpenTabletop is a specification, not a product. This guide is for developers who want to build a conforming server, generate client SDKs, or validate their implementation against the standard.

## Generating Client SDKs

The OpenAPI 3.1 specification at `spec/openapi.yaml` is the source of truth. Any OpenAPI-compatible code generator can produce client SDKs from it. Common options:

| Generator | Languages | Command |
|-----------|-----------|---------|
| [openapi-generator](https://openapi-generator.tech/) | 50+ (Rust, Python, TypeScript, Java, Go, ...) | `openapi-generator-cli generate -i spec/bundled/openapi.yaml -g python -o my-sdk/` |
| [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) | Go | `oapi-codegen -package api spec/bundled/openapi.yaml > api.gen.go` |
| [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) | TypeScript | `npx openapi-typescript spec/bundled/openapi.yaml -o schema.d.ts` |

Before generating, bundle the multi-file spec into a single file:

```sh
./scripts/bundle-spec.sh
# Output: spec/bundled/openapi.yaml
```

## Building a Conforming Server

A conforming server implements the endpoints, schemas, and behaviors described in the OpenAPI specification. The specification does not mandate any particular technology stack -- choose what fits your team and infrastructure.

### Recommended Architecture

The ADRs in the [Infrastructure & Implementation Guidance](../adr/index.md) section document recommended patterns:

- **Twelve-factor design** (ADR-0020) -- Config from environment, stateless processes, port binding
- **Container images** (ADR-0021) -- Distroless base images, multi-stage builds
- **Observability** (ADR-0023) -- Structured JSON logging, OpenTelemetry traces and metrics
- **Database** (ADR-0027, ADR-0029) -- PostgreSQL with full-text search, versioned SQL migrations
- **Caching** (ADR-0028) -- Cache-Control headers and ETags

These are recommendations, not requirements. A conforming server built with Django and MySQL is just as valid as one built with Axum and PostgreSQL, provided it implements the API contract correctly.

### Key Implementation Concerns

- **Expansion combination resolution** -- The three-tier resolution model (explicit combination, computed delta sum, base fallback) is the most complex part of the spec. See [ADR-0007](../adr/0007-combinatorial-expansion-property-model.md) and the [Property Deltas](../pillars/data-model/property-deltas.md) documentation.
- **Compound filtering** -- Six composable dimensions with AND cross-dimension, OR within-dimension semantics. See [Filtering & Windowing](../pillars/filtering/overview.md).
- **Bulk export** -- JSON Lines and CSV streaming with manifest checksums. See [Data Export](../pillars/statistics/export.md).

## Using Sample Data

The `data/samples/` directory contains demonstration records that conform to the OpenAPI schemas. Use these for:

- **Testing your implementation** -- Load sample data and verify your endpoints return the expected shapes
- **Understanding the data model** -- See how a fully populated game record looks with expansions, polls, effective properties, and relationships
- **Seeding a development database** -- Start with real-world-shaped data rather than synthetic test fixtures

The `data/taxonomy/` directory contains the canonical controlled vocabularies (mechanics, categories, themes). Any conforming implementation should use these exact slugs and hierarchies.

## Validating Conformance

To verify your implementation conforms to the spec:

1. **Schema validation** -- Ensure your API responses match the schemas in `spec/schemas/`
2. **Endpoint coverage** -- Implement the paths defined in `spec/paths/`
3. **Pagination** -- Use keyset (cursor-based) pagination per ADR-0012
4. **Error format** -- Return RFC 9457 Problem Details per ADR-0015
5. **Filtering semantics** -- AND across dimensions, OR within dimensions, NOT via `_not` parameters

A formal conformance test suite is a future goal (see [ADR-0045](../adr/0045-specification-only-repository.md)).
