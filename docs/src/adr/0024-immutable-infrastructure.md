---
status: accepted
date: 2026-03-12
---

# ADR-0024: Immutable Infrastructure with Blue-Green Deployment

## Context and Problem Statement

Deploying updates to the reference server must be safe, reproducible, and reversible. Mutable infrastructure (patching running servers) leads to configuration drift, unreproducible environments, and risky rollbacks. We need a deployment philosophy that ensures every deployment is a clean, known state and that rollbacks are trivial.

## Decision Drivers

* Every deployment must be reproducible from a known, versioned artifact
* Rollbacks must be instant and safe -- no partial state between versions
* Configuration drift between environments must be eliminated
* The deployment pipeline must support canary and blue-green release strategies

## Considered Options

* Mutable servers with in-place patching and configuration management (Ansible, Chef)
* Immutable container images tagged by git SHA with blue-green deployment
* Full GitOps with reconciliation controllers (ArgoCD, Flux)

## Decision Outcome

Chosen option: "Immutable container images with blue-green deployment", because it guarantees that every deployment runs exactly the same artifact that was tested in CI. Container images are tagged with the git SHA that produced them -- never `latest`, never mutable tags. No runtime patching, no SSH-and-fix. To deploy a new version, the blue-green strategy routes traffic to a new set of instances running the new image while the old instances remain available for instant rollback. Canary deployment (routing a percentage of traffic to the new version) is supported as an alternative for high-risk changes. Mutable servers were rejected because they inevitably lead to configuration drift. Full GitOps was rejected as overkill for the initial project scope, though it is a natural evolution path.

### Consequences

* Good, because every deployment is reproducible -- the git SHA uniquely identifies exactly what is running
* Good, because rollbacks are instant -- just route traffic back to the previous image
* Good, because configuration drift is impossible when servers are never mutated
* Bad, because every change, no matter how small, requires building and deploying a new container image
* Bad, because blue-green deployment doubles the infrastructure cost during deployment windows
