---
status: accepted
date: 2026-03-12
---

# ADR-0023: OpenTelemetry for Unified Observability

## Context and Problem Statement

Operating the reference server requires visibility into application behavior through three pillars of observability: logs, metrics, and traces. These signals must be collected, exported, and correlated to diagnose issues effectively. We need an observability strategy that is vendor-neutral, standards-based, and provides unified correlation across all three signal types.

## Decision Drivers

* Observability must cover all three pillars: structured logs, metrics, and distributed traces
* The solution must be vendor-neutral — operators should choose their own backends (Grafana, Datadog, etc.)
* Trace IDs must correlate across logs, metrics, and traces for unified debugging
* The instrumentation overhead must be minimal in production

## Considered Options

* Custom structured logging with application-specific metrics
* ELK stack (Elasticsearch, Logstash, Kibana) as a coupled observability solution
* OpenTelemetry for vendor-neutral, unified observability

## Decision Outcome

Chosen option: "OpenTelemetry", because it provides a single, vendor-neutral standard for all three observability pillars with built-in correlation. Structured JSON logging includes trace IDs and span IDs in every log line, enabling correlation with distributed traces. Prometheus-format metrics are exposed at `/metrics` for scraping, covering request latency histograms, request counts by endpoint and status, active connection gauges, and database pool metrics. Distributed traces use the OTEL SDK with configurable exporters (OTLP, Jaeger, Zipkin). All three signals share the same trace context, so a single trace ID links a log entry to its metric dimensions and trace span. ELK was rejected because it couples the application to a specific backend stack. Custom logging was rejected because it lacks standardized correlation across signals.

### Consequences

* Good, because operators can use any OTEL-compatible backend (Grafana+Tempo, Datadog, Honeycomb, etc.)
* Good, because trace-correlated logs enable end-to-end request debugging across services
* Good, because Prometheus metrics enable standard alerting and dashboarding workflows
* Bad, because the OTEL SDK adds a runtime dependency and some performance overhead to every request
* Bad, because configuring exporters and sampling strategies adds operational complexity
