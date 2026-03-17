---
status: accepted
date: 2026-03-12
---

# ADR-0019: Bulk Data Export Endpoints

## Context and Problem Statement

Data scientists, researchers, and application developers who need the complete dataset should not have to paginate through thousands of API requests to build a local copy. The API needs a bulk export mechanism that provides the full dataset efficiently in formats suitable for data analysis pipelines. This is distinct from the paginated API, which is optimized for interactive use.

## Decision Drivers

* Data science workflows need the complete dataset in analysis-friendly formats
* Bulk export should not compete with interactive API traffic for resources
* Export formats must be widely supported by data tools (pandas, R, SQL imports)
* The export mechanism should include metadata about freshness and completeness

## Considered Options

* No bulk export -- consumers must paginate through the full API
* Paginate-all pattern with a special "dump" mode on existing endpoints
* Dedicated export endpoints with streaming responses and manifest metadata

## Decision Outcome

Chosen option: "Dedicated export endpoints with ExportManifest", because they provide a purpose-built interface for bulk data access that does not compromise the interactive API's performance or design. The `GET /export/games` endpoint supports JSON Lines (default) and CSV via content negotiation (`Accept` header). Each export response includes an `ExportManifest` header with fields: `total_records`, `export_timestamp`, `spec_version`, and `checksum`. JSON Lines format is used instead of a single JSON array to enable streaming processing without loading the entire response into memory. CSV is offered for spreadsheet and SQL import workflows. Parquet format is documented as a future enhancement via content negotiation. The paginate-all approach was rejected because it overloads the interactive API's pagination semantics with a fundamentally different use case.

### Consequences

* Good, because data scientists can download the complete dataset in a single streaming request
* Good, because JSON Lines enables memory-efficient streaming processing
* Good, because the ExportManifest provides the metadata needed for data pipeline integrity checks
* Bad, because dedicated export endpoints duplicate some logic from the main API endpoints
* Bad, because large exports consume significant server resources and may need to be rate-limited separately
