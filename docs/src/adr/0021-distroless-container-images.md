---
status: accepted
date: 2026-03-12
---

# ADR-0021: Distroless Container Images

## Context and Problem Statement

The reference server is distributed as a container image. The base image choice affects image size, attack surface, build time, and debugging capabilities. We need a base image strategy that minimizes security risk and image size while still supporting the operational needs of a production service (health checks, graceful shutdown, signal handling).

## Decision Drivers

* Minimal attack surface — fewer packages mean fewer CVE exposure points
* Small image size for fast pulls and reduced storage costs
* The container must support health check endpoints and signal handling
* Multi-stage builds should produce a clean separation between build and runtime artifacts

## Considered Options

* Alpine Linux base image
* Debian slim base image
* Google distroless base image

## Decision Outcome

Chosen option: "Distroless base image with multi-stage Dockerfile", because it provides the smallest possible attack surface by containing only the application binary, its runtime dependencies, and CA certificates — no shell, no package manager, no utilities that an attacker could exploit. The Dockerfile uses a multi-stage build: the first stage uses a full Rust toolchain image for compilation, and the final stage copies only the compiled binary into `gcr.io/distroless/cc-debian12`. The application exposes `/healthz` (liveness — returns 200 if the process is running) and `/readyz` (readiness — returns 200 if the database connection pool is healthy) health endpoints. The application handles SIGTERM for graceful shutdown, draining in-flight requests before exiting. Alpine was rejected because musl libc can cause subtle compatibility issues with some Rust crates. Debian slim was rejected because it includes a shell and package manager that increase attack surface unnecessarily.

### Consequences

* Good, because the runtime image contains no shell, package manager, or unnecessary utilities
* Good, because image size is minimal (typically under 30MB for a Rust binary)
* Good, because health endpoints enable Kubernetes liveness and readiness probes
* Bad, because distroless images cannot be exec'd into for debugging (mitigated by using a debug variant in staging)
* Bad, because the lack of a shell means troubleshooting must be done via application logs and external tooling
