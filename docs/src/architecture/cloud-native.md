# Cloud-Native Design

> **For implementers.** This chapter provides guidance for operators building and deploying a conforming OpenTabletop server. The patterns described here are not mandatory for conformance, but they represent best practices drawn from the project's ADRs.

A conforming server should be designed for cloud-native deployment from the ground up. This means following the [Twelve-Factor App](https://12factor.net/) methodology and building to run in containerized environments, orchestrated by Kubernetes or similar platforms.

## Deployment Topology

```mermaid
flowchart TD
    subgraph "Internet"
        CLIENT["API Consumers"]
    end

    subgraph "Edge"
        LB["Load Balancer<br/><i>Cloud provider LB</i>"]
    end

    subgraph "Kubernetes Cluster"
        subgraph "API Tier"
            API1["API Pod 1"]
            API2["API Pod 2"]
            API3["API Pod 3"]
        end

        subgraph "Cache Tier"
            REDIS["Redis<br/><i>Cache + Rate Limiting</i>"]
        end

        subgraph "Data Tier"
            PG_PRIMARY["PostgreSQL Primary<br/><i>Writes</i>"]
            PG_REPLICA["PostgreSQL Replica<br/><i>Reads</i>"]
        end

        subgraph "Observability"
            OTEL["OpenTelemetry<br/>Collector"]
            PROM["Prometheus"]
            LOKI["Loki"]
        end
    end

    CLIENT --> LB
    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS

    API1 --> PG_REPLICA
    API2 --> PG_REPLICA
    API3 --> PG_REPLICA
    API1 -.->|writes| PG_PRIMARY
    PG_PRIMARY -->|replication| PG_REPLICA

    API1 --> OTEL
    API2 --> OTEL
    API3 --> OTEL
    OTEL --> PROM
    OTEL --> LOKI

    style LB fill:#757575,color:#fff
    style API1 fill:#1976d2,color:#fff
    style API2 fill:#1976d2,color:#fff
    style API3 fill:#1976d2,color:#fff
    style REDIS fill:#00796b,color:#fff
    style PG_PRIMARY fill:#388e3c,color:#fff
    style PG_REPLICA fill:#388e3c,color:#fff
    style OTEL fill:#f57c00,color:#fff
```

## Twelve-Factor Principles

### I. Codebase
One codebase tracked in Git, many deploys (staging, production, developer instances).

### II. Dependencies
All dependencies declared in a manifest and lock file (e.g., `Cargo.toml`, `package.json`, `go.mod`). No system-level implicit dependencies. The container image includes everything needed to run.

### III. Config
All configuration via environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `REDIS_URL` | Redis connection string (optional) | `redis://host:6379` |
| `PORT` | HTTP listen port | `8080` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector | `http://otel:4317` |
| `RATE_LIMIT_RPS` | Requests per second per API key | `100` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://app.example.com` |

No config files. No `application.yml`. No `settings.toml` baked into the image.

### IV. Backing Services
PostgreSQL and Redis are attached resources, referenced by URL. Swapping a local PostgreSQL for an RDS instance is a config change, not a code change.

### V. Build, Release, Run
The CI pipeline produces a container image (build), tags it with a version (release), and deploys it to Kubernetes (run). These stages are strictly separated.

### VI. Processes
The server is a stateless process. No in-memory session state, no local file storage. Multiple instances serve the same traffic behind a load balancer.

### VII. Port Binding
The server binds to a port (`$PORT`) and serves HTTP directly. No app server wrapper required -- the application is the HTTP server.

### VIII. Concurrency
Horizontal scaling via process count. Need more throughput? Add more pods. An async runtime also scales vertically across CPU cores within a single process.

### IX. Disposability
Fast startup (< 1 second). Graceful shutdown on SIGTERM (finish in-flight requests, close database connections). Pods can be killed and restarted at any time without data loss.

### X. Dev/Prod Parity
The same Docker image runs in development, staging, and production. Environment variables differentiate. `docker compose` provides a local stack that mirrors production topology.

### XI. Logs
Logs are written to stdout as structured JSON. No log files, no log rotation. The orchestrator (Kubernetes) captures stdout and ships to Loki or your log aggregator of choice.

### XII. Admin Processes
Database migrations, data imports, and other admin tasks run as one-off Kubernetes Jobs using the same container image. They are not baked into the server startup.

## OpenTelemetry

A conforming server should be instrumented with OpenTelemetry for distributed tracing, metrics, and logs:

**Traces:** Every HTTP request generates a trace span. Database queries, cache lookups, and filter evaluation are child spans. Consumers can pass a `traceparent` header (W3C Trace Context) for end-to-end tracing.

**Metrics:** Request count, latency histograms (p50, p95, p99), active connections, cache hit rate, database query duration. Exposed as Prometheus metrics at `/metrics`.

**Logs:** Structured JSON logs with trace ID correlation. Every log line includes the trace ID so you can jump from a log entry to its full request trace.

## Container Image

A conforming server should ship as a minimal container image:

- **Base:** `scratch` or `distroless` -- no shell, no package manager, no attack surface.
- **Binary:** A single statically-linked binary or minimal runtime. No unnecessary runtime dependencies.
- **Size:** Keep images small. Pulls should complete in seconds.
- **Health check:** `/health` endpoint returns 200 if the server is up and can reach PostgreSQL. `/ready` returns 200 when the server is ready to accept traffic (connection pool warmed, migrations verified).

## Kubernetes Readiness

A conforming server should be designed for Kubernetes deployment with:

- Readiness and liveness probes at `/ready` and `/health`.
- Graceful shutdown respecting the termination grace period.
- Resource requests and limits tuned for the query workload (CPU-bound for filter evaluation, memory-bound for connection pools).
- Horizontal Pod Autoscaler based on request latency or CPU utilization.
- PodDisruptionBudget to maintain availability during node maintenance.
