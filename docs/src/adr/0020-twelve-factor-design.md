---
status: accepted
date: 2026-03-12
---

# ADR-0020: Twelve-Factor Application Design

## Context and Problem Statement

The OpenTabletop reference server must be deployable across diverse environments — local development, CI/CD pipelines, cloud VMs, and Kubernetes clusters. The deployment and runtime model should follow established best practices that ensure portability, scalability, and operational simplicity. We need an architectural philosophy that guides operational decisions consistently.

## Decision Drivers

* The reference server must run identically in development and production environments
* Configuration must be externalized and environment-specific, not baked into the binary
* The application must be stateless and horizontally scalable
* The design should align with modern container orchestration platforms

## Considered Options

* Traditional deployment with configuration files and persistent server state
* Container-first design with 12-factor principles
* Serverless / Function-as-a-Service architecture

## Decision Outcome

Chosen option: "Container-first with 12-factor principles", because the twelve-factor methodology provides battle-tested guidelines for building cloud-native applications that are portable, scalable, and operationally sound. Specifically: configuration is read exclusively from environment variables (Factor III); the application binds to a port specified by the `PORT` environment variable (Factor VII); processes are stateless and share nothing (Factor VI); the application starts fast and shuts down gracefully on SIGTERM (Factor IX); development and production use the same backing services and dependencies (Factor X). Serverless was rejected because the API's connection pooling and in-memory caching patterns are a poor fit for ephemeral function instances. Traditional deployment was rejected because it couples the application to specific infrastructure.

### Consequences

* Good, because the application runs identically across all environments with only environment variable differences
* Good, because stateless processes enable horizontal scaling by simply adding instances
* Good, because graceful shutdown and fast startup support zero-downtime deployments
* Bad, because strict adherence to 12-factor (e.g., no local filesystem state) requires external services for features like file-based caching
* Bad, because environment variable configuration can become unwieldy with many settings (mitigated by structured naming conventions)
