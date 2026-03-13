---
status: accepted
date: 2026-03-12
---

# ADR-0022: Kubernetes-Native Deployment with Docker Compose Fallback

## Context and Problem Statement

The reference server needs deployment manifests that work for both production Kubernetes clusters and local development environments. Kubernetes is the dominant container orchestration platform, but requiring it for local development creates an unnecessary barrier. We need a deployment strategy that targets Kubernetes as the primary platform while keeping local development simple.

## Decision Drivers

* Production deployments should leverage Kubernetes features (rolling updates, HPA, service discovery)
* Local development should not require a Kubernetes cluster
* Deployment manifests should be version-controlled and reproducible
* The deployment model should support both single-instance and horizontally-scaled configurations

## Considered Options

* Bare metal deployment with systemd units
* Docker Compose as the sole deployment target
* Kubernetes-native manifests with Docker Compose fallback for local development

## Decision Outcome

Chosen option: "Kubernetes-native with Docker Compose fallback", because Kubernetes provides the scaling, self-healing, and deployment features needed for production while Docker Compose offers the simplest possible local development experience. The project ships Kubernetes manifests including: Deployment (with resource limits, health probes, and rolling update strategy), Service (ClusterIP), Ingress (with TLS), ConfigMap (for non-secret configuration), and HorizontalPodAutoscaler (CPU/memory-based scaling). For local development, a `docker-compose.yml` provides the application, PostgreSQL, and optional observability stack with a single `docker compose up` command. Bare metal was rejected because it couples deployment to specific OS and infrastructure. Docker Compose alone was rejected because it lacks production-grade orchestration features.

### Consequences

* Good, because Kubernetes manifests enable production-grade deployment with scaling, health checks, and rolling updates
* Good, because Docker Compose provides a zero-config local development experience
* Good, because both deployment targets use the same container image, ensuring environment parity
* Bad, because maintaining two sets of deployment configuration (K8s manifests and docker-compose.yml) requires keeping them in sync
* Bad, because Kubernetes manifests add complexity that smaller deployments may not need
