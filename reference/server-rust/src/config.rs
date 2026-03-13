// 12-factor configuration (ADR-0020)
// All configuration via environment variables — no config files.
//
// Required:
//   DATABASE_URL     — PostgreSQL connection string
//
// Optional:
//   PORT             — Server port (default: 8080)
//   LOG_LEVEL        — tracing filter (default: info)
//   OTEL_ENDPOINT    — OpenTelemetry collector endpoint
//   CACHE_TTL_STATIC — Cache-Control max-age for game metadata (default: 86400)
//   CACHE_TTL_DYNAMIC — Cache-Control max-age for dynamic data (default: 300)
//   RATE_LIMIT_PUBLIC — Requests/min for unauthenticated (default: 60)
//   RATE_LIMIT_AUTHED — Requests/min for API key holders (default: 600)
