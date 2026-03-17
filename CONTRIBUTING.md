# Contributing to OpenTabletop

Thank you for your interest in contributing to OpenTabletop. This document explains how to participate.

OpenTabletop is a global standard. Contributions, discussions, and proposals are welcome in any language. If you are more comfortable writing in Japanese, German, Portuguese, Korean, or any other language, please do so -- the community will work with translators to ensure your contribution is understood and considered equally. The specification serves board game communities worldwide, and we value perspectives from all of them.

## Types of Contributions

### Spec Changes (RFC Process)

Changes to the OpenAPI specification require a formal RFC:

1. **Open a Discussion** using the RFC template in GitHub Discussions
2. **Write an RFC** describing the change, motivation, and alternatives considered
3. **Community discussion** period (minimum 7 days)
4. **Steering committee vote** for acceptance
5. **Submit a PR** with the spec change, updated documentation, and new or updated examples if applicable

Spec changes that also require a new ADR should use the `/create-adr` Claude skill or follow the MADR 4.0.0 template in `docs/src/adr/`.

### Data Contributions

To correct or add board game data (taxonomy terms, sample records, BGG mappings):

1. Open an issue using the **Data Correction** template
2. Provide source references (BGG link, publisher page, etc.)
3. A maintainer will verify and merge

### Documentation & Tooling

For documentation improvements, script fixes, or taxonomy viewer enhancements:

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Submit a pull request using the PR template
5. Ensure CI passes (spec validation, docs build, ADR check)

## Development Setup

### Prerequisites

- [Node.js 20+](https://nodejs.org/) (for spec tooling and bundling)
- [mdbook](https://rust-lang.github.io/mdBook/) (for documentation)
- [mdbook-mermaid](https://github.com/badboy/mdbook-mermaid) (for diagrams)

### Building Documentation

```sh
mdbook serve docs/
```

### Validating the OpenAPI Spec

```sh
npx @stoplight/spectral-cli lint spec/openapi.yaml
```

## Coding Standards

- Spec files: YAML, 2-space indent, PascalCase for schema names, kebab-case for paths
- Data files: YAML, 2-space indent, lowercase hyphenated slugs
- Scripts: Bash, shellcheck-clean

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(spec): add player count poll endpoint
fix(data): correct Spirit Island mechanic classification
docs(adr): add ADR-0045 for specification-only repository
```

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). Please read it before participating.
