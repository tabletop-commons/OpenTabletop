---
status: accepted
date: 2026-03-12
---

# ADR-0015: RFC 9457 Problem Details for Error Responses

## Context and Problem Statement

A well-designed API needs a consistent, machine-readable error response format. Clients must be able to programmatically distinguish error types, extract human-readable messages, and handle validation failures with field-level detail. We need an error format that is standardized, extensible, and compatible with HTTP semantics.

## Decision Drivers

* Error responses must be machine-parseable with a consistent structure across all endpoints
* Validation errors must include field-level detail (which field, what constraint, what value)
* The format should be an established standard to avoid inventing a proprietary error schema
* The format must support extension fields for domain-specific error information

## Considered Options

* Custom error format specific to the project
* RFC 7807 Problem Details for HTTP APIs
* RFC 9457 Problem Details for HTTP APIs (supersedes RFC 7807)

## Decision Outcome

Chosen option: "RFC 9457 Problem Details", because it is the current IETF standard for HTTP API error responses, superseding RFC 7807 with clarifications and improvements. Every error response uses the `application/problem+json` media type and includes the standard fields: `type` (URI identifying the error kind), `title` (human-readable summary), `status` (HTTP status code), `detail` (human-readable explanation specific to this occurrence), and `instance` (URI identifying this specific occurrence). For validation errors, we extend with a custom `errors` array containing objects with `field`, `constraint`, and `message` properties. RFC 7807 was rejected because RFC 9457 supersedes it. A custom format was rejected because it would require every client to learn a proprietary schema.

### Consequences

* Good, because RFC 9457 is an IETF standard that many HTTP libraries already understand
* Good, because the `type` URI enables programmatic error handling without string matching on messages
* Good, because extension fields allow rich validation error details without breaking the standard format
* Bad, because RFC 9457 is relatively new and some older tooling may only recognize RFC 7807
* Bad, because the `type` URI field requires maintaining a registry of error type URIs
