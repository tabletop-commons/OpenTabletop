---
status: accepted
date: 2026-03-12
---

# ADR-0033: mdbook with Mermaid for Documentation

## Context and Problem Statement

The OpenTabletop project needs a documentation site for the specification, ADRs, architecture guides, and contributor documentation. The documentation tool should integrate naturally with the project's Rust ecosystem, support architecture diagrams, and deploy easily to GitHub Pages via CI. Markdown-based authoring is essential so that documentation changes go through the same PR review process as code.

## Decision Drivers

* Documentation must be authored in Markdown and version-controlled alongside the code
* Architecture diagrams should be defined as code (not binary images) for reviewability
* The documentation tool should align with the Rust ecosystem used by the reference server
* Deployment to GitHub Pages via CI should be straightforward

## Considered Options

* Docusaurus (React-based, JavaScript ecosystem)
* mdbook (Rust-based, Markdown-native)
* MkDocs with Material theme (Python-based)

## Decision Outcome

Chosen option: "mdbook with mermaid preprocessor", because it is the standard documentation tool in the Rust ecosystem (used by the Rust Book, Tokio, and many other Rust projects), producing fast, clean, static sites from Markdown. The mdbook-mermaid preprocessor enables architecture diagrams, entity relationship diagrams, sequence diagrams, and flowcharts to be written as Mermaid code blocks directly in Markdown -- making them reviewable in PRs and diffable in version control. Deployment is a single `mdbook build` command, producing static HTML that is deployed to GitHub Pages via a CI workflow. Docusaurus was rejected because it requires a Node.js toolchain that is not otherwise used in the project. MkDocs was rejected because it requires a Python toolchain; while functional, mdbook better aligns with the Rust-first ecosystem of the reference server.

### Consequences

* Good, because mdbook aligns with the Rust ecosystem, requiring no additional toolchains
* Good, because Mermaid diagrams are code-reviewable Markdown, not binary images
* Good, because static HTML output deploys trivially to GitHub Pages with no server-side runtime
* Bad, because mdbook has fewer themes and plugins than Docusaurus or MkDocs Material
* Bad, because Mermaid diagrams render client-side, which may be slow for very complex diagrams
