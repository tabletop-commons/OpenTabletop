// Health check endpoints (ADR-0021)
//
// GET /healthz — Liveness probe
//   Returns 200 if the process is alive. No dependency checks.
//   Used by Kubernetes liveness probe.
//
// GET /readyz — Readiness probe
//   Returns 200 if the server can serve traffic (DB connected, migrations applied).
//   Returns 503 if any dependency is unhealthy.
//   Used by Kubernetes readiness probe.
