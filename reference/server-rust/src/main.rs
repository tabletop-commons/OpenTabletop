// OpenTabletop Reference Server
//
// This is the reference implementation of the OpenTabletop API specification.
// It is ONE valid implementation -- not the only one. Any implementation that
// conforms to the OpenAPI spec in spec/openapi.yaml is equally valid.
//
// Stack: Axum + SQLx + PostgreSQL (see ADR-0025)
// Design: 12-factor, cloud-native (see ADR-0020)

// TODO: Implement the following route groups:
//
// Games:
//   GET  /games                          -- List with compound filtering (ADR-0013)
//   POST /games/search                   -- Complex compound queries
//   GET  /games/{id}                     -- Single game with ?include=
//   GET  /games/{id}/expansions          -- Expansions/promos for a game
//   GET  /games/{id}/relationships       -- Typed relationships (ADR-0011)
//   GET  /games/{id}/effective-properties -- Combinatorial delta computation (ADR-0007)
//   GET  /games/{id}/player-count-poll   -- Per-count voting data (ADR-0010)
//
// Taxonomy:
//   GET  /mechanics                      -- Controlled vocabulary (ADR-0009)
//   GET  /categories
//   GET  /themes
//
// People:
//   GET  /designers
//   GET  /designers/{id}
//   GET  /publishers
//   GET  /publishers/{id}
//
// Search:
//   GET  /search?q=                      -- Full-text search (ADR-0027)
//
// Export:
//   GET  /export/games                   -- Bulk data export (ADR-0019)
//
// Health:
//   GET  /healthz                        -- Liveness probe
//   GET  /readyz                         -- Readiness probe (DB connectivity)
//   GET  /metrics                        -- Prometheus metrics (ADR-0023)

fn main() {
    println!("OpenTabletop reference server -- not yet implemented");
    println!("See spec/openapi.yaml for the API specification");
}
