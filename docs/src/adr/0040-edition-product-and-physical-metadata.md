---
status: proposed
date: 2026-03-15
---

# ADR-0040: Edition Product and Physical Metadata

## Context and Problem Statement

The GameEdition schema ([ADR-0035](0035-edition-level-property-deltas.md)) currently tracks only basic metadata: name, year, publisher (singular), language, notes, and property deltas. Real-world editions carry significantly more data. Brass: Birmingham has 31 editions on BGG, each with product codes (UPC/EAN/SKU), physical dimensions, box weight, specific release dates, release status, per-edition box art, and per-edition artist credits. Some editions have multiple co-publishers (e.g., "Roxley, TLAMA games" for the Czech edition).

Without this data, the specification cannot serve publishers (who need product codes for retail distribution, dimensions for shipping, and release dates for marketing) or consumers (who need to identify which physical product they own). The singular `publisher_id` field is also a data fidelity issue -- co-published editions are common in international markets.

## Decision Drivers

* Publishers need product codes (UPC/EAN) for retail distribution and inventory management
* Physical dimensions and box weight are essential for shipping cost calculation and shelf planning
* Release dates (full ISO dates, not just year) are needed for marketing calendars and pre-order tracking
* Per-edition box art enables product identification -- different editions often have different cover art
* Multiple publishers per edition is common (co-publishing agreements for international editions)
* BGG tracks all of these fields per version; migration fidelity requires them
* The specification is pre-v1.0, so breaking changes to GameEdition are acceptable

## Considered Options

* **Extend GameEdition in place** -- Add new fields directly to the existing schema
* **Create a separate EditionProduct schema** -- Split product metadata into its own schema linked to GameEdition
* **Leave edition metadata minimal** -- Keep editions focused on property deltas; product data is implementation-specific

## Decision Outcome

Chosen option: "Extend GameEdition in place," because all these fields are intrinsic properties of a published edition -- they describe what the physical product *is*. Splitting them into a separate schema would create an artificial boundary that complicates both the API (two entities to fetch per edition) and the data model (a 1:1 relationship masquerading as separate entities). Leaving editions minimal was rejected because publishers and consumers need this data, and BGG migration requires it.

The `publisher_id` singular field is replaced with `publisher_ids` array. Since the spec is at version 0.1.0 with no conforming implementations, this breaking change is acceptable per [ADR-0005](0005-semantic-versioning.md).

### Consequences

* Good, because editions fully describe the physical product -- enough data for a publisher to identify, ship, and market
* Good, because product codes enable barcode scanning and retail system integration
* Good, because per-edition images allow consumers to visually identify their specific edition
* Good, because multiple publishers per edition accurately represents co-publishing
* Good, because release status enables pre-order tracking and out-of-print detection
* Bad, because GameEdition becomes a larger schema (from 8 to 17 properties) -- but editions are inherently data-rich
* Bad, because `publisher_id` to `publisher_ids` is a breaking change -- acceptable pre-v1.0

## Implementation

### GameEdition Schema Changes

Replace `publisher_id` (singular UUID) with:
- `publisher_ids` (UUID[], required, minItems: 1) -- Multiple publishers for co-published editions

Add new fields:
- `product_codes` (ProductCode[]) -- Array of typed product identifiers
- `dimensions` (PhysicalDimensions) -- Box dimensions with unit
- `box_weight` (PhysicalWeight) -- Box weight with unit (distinct from complexity weight)
- `release_status` (enum: announced, preorder, released, out_of_print)
- `release_date` (ISO 8601 date) -- Full date, more precise than year_published
- `image_url` (URI) -- Per-edition box art
- `thumbnail_url` (URI) -- Per-edition thumbnail
- `artist_ids` (UUID[]) -- Per-edition artist credits

### New Sub-Schemas

**ProductCode** -- Typed product identifier:
- `type` (enum: upc, ean, isbn, sku, asin)
- `code` (string)

**PhysicalDimensions** -- Box dimensions:
- `length`, `width`, `height` (float)
- `unit` (enum: cm, in, default: cm)

**PhysicalWeight** -- Box weight:
- `value` (float)
- `unit` (enum: kg, lb, default: kg)

### BGG Migration Mapping

| BGG Version Field | OpenTabletop Edition Field |
|------------------|--------------------------|
| item name | `name` |
| yearpublished | `year_published` |
| publisher link | `publisher_ids` (array) |
| language | `language` (BCP 47) |
| productcode | `product_codes` (type: sku) |
| width × length × depth | `dimensions` |
| weight | `box_weight` |
| image | `image_url` |
| thumbnail | `thumbnail_url` |
| N/A (inferred) | `release_status` |
| releasedate (if available) | `release_date` |
