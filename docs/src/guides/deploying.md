# Deploying & Operating

This guide covers how to deploy and operate a conforming OpenTabletop server in production. It assumes you have already built a server following the [Implementer's Guide](./implementing.md) and are ready to run it.

The guide is practical -- every section includes concrete examples you can adapt. For the *rationale* behind these patterns, see the [Infrastructure & Implementation Guidance](../adr/index.md) ADRs.

## Local Development Stack

Start with a local stack that mirrors production. This `docker-compose.yml` runs PostgreSQL with schema auto-loaded on first startup:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: opentabletop
      POSTGRES_USER: ot
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./data/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./data/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

volumes:
  pgdata:
```

For production observability, add an OpenTelemetry collector ([ADR-0023](../adr/0023-observability-structured-logging-opentelemetry.md)):

```yaml
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    ports:
      - "4317:4317"   # gRPC OTLP receiver
      - "4318:4318"   # HTTP OTLP receiver
      - "8889:8889"   # Prometheus exporter
    volumes:
      - ./otel-config.yaml:/etc/otelcol-contrib/config.yaml
```

Start it and load sample data:

```sh
docker compose up -d
node scripts/load-samples.js --connection "postgresql://ot:localdev@localhost/opentabletop"
```

Verify:

```sh
curl http://localhost:8080/v1/games/spirit-island
curl http://localhost:8080/healthz
```

## Container Image

Build your server as a multi-stage container image. The pattern is language-agnostic -- replace the build stage with your stack:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

# Stage 2: Runtime (distroless -- see ADR-0021)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 8080
CMD ["dist/server.js"]
```

Replace the Node.js images above with the latest stable version for your language (`rust:latest`, `golang:latest`, `python:3-slim`, etc.). Pin to a major version tag rather than a specific patch to keep builds reproducible without going stale.

Key requirements:
- **Distroless base** ([ADR-0021](../adr/0021-distroless-container-images.md)) -- No shell, no package manager, minimal attack surface. Target < 50MB final image.
- **Health endpoints** -- Expose `/healthz` (liveness: "process is alive") and `/readyz` (readiness: "can serve traffic, database connected").
- **Tag by git SHA**, never `latest` ([ADR-0024](../adr/0024-immutable-infrastructure.md)):

```sh
docker build -t ghcr.io/your-org/opentabletop:$(git rev-parse --short HEAD) .
docker push ghcr.io/your-org/opentabletop:$(git rev-parse --short HEAD)
```

## Configuration (12-Factor)

All configuration comes from environment variables ([ADR-0020](../adr/0020-twelve-factor-design.md)). Never bake secrets into images.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `PORT` | No | `8080` | HTTP listen port |
| `REDIS_URL` | No | -- | Redis connection string (cache layer) |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | No | `json` | `json` for production, `pretty` for local dev |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | -- | OpenTelemetry collector endpoint |
| `OTEL_SERVICE_NAME` | No | `opentabletop` | Service name in traces/metrics |
| `API_KEY_SALT` | Yes | -- | HMAC salt for API key hashing |
| `RATE_LIMIT_ANONYMOUS` | No | `60` | Requests/minute for unauthenticated clients |
| `RATE_LIMIT_AUTHENTICATED` | No | `600` | Requests/minute for API key holders |
| `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins |

For Kubernetes, use a ConfigMap for non-sensitive values and Secrets for credentials:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: opentabletop-config
data:
  PORT: "8080"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  OTEL_SERVICE_NAME: "opentabletop"
  RATE_LIMIT_ANONYMOUS: "60"
  RATE_LIMIT_AUTHENTICATED: "600"
```

## Kubernetes Deployment

Complete manifests for a production deployment. Adjust resource requests and replica counts for your scale.

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opentabletop
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: opentabletop
  template:
    metadata:
      labels:
        app: opentabletop
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: server
          image: ghcr.io/your-org/opentabletop:abc1234
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: opentabletop-config
            - secretRef:
                name: opentabletop-secrets
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Service, Ingress, HPA

```yaml
apiVersion: v1
kind: Service
metadata:
  name: opentabletop
spec:
  selector:
    app: opentabletop
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: opentabletop
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts: [api.yourdomain.com]
      secretName: opentabletop-tls
  rules:
    - host: api.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: opentabletop
                port:
                  number: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: opentabletop
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: opentabletop
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: opentabletop
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: opentabletop
```

### Graceful Shutdown

Your server must handle `SIGTERM` by:
1. Stop accepting new connections
2. Finish in-flight requests (within `terminationGracePeriodSeconds`)
3. Close database connections
4. Exit cleanly

This ensures zero-downtime rolling updates. The `readinessProbe` failure during shutdown prevents new traffic from routing to a terminating pod.

## Database Operations

### PostgreSQL Setup

Recommended version: **PostgreSQL 16+** (improved `JSONB` performance, parallel query improvements, and `MERGE` support).

The [recommended schema](https://github.com/tabletop-commons/OpenTabletop/blob/main/data/samples/schema.sql) creates all tables, indexes, and the full-text search `tsvector` column. For production, also consider:

- **Connection pooling** -- Use PgBouncer or your framework's built-in pool. Target 10-20 connections per pod, sized to your PostgreSQL `max_connections`.
- **Read replicas** -- Route `/export/games` and trend endpoints to replicas. These are read-heavy, long-running queries that should not compete with interactive API requests.

### Migrations

Follow the [ADR-0029](../adr/0029-versioned-sql-migrations.md) naming convention:

```
migrations/
  0001_initial_schema.sql
  0002_add_experience_playtime.sql
  0003_add_game_snapshots.sql
```

Use any SQL-native migration runner (golang-migrate, Flyway, dbmate, or plain `psql`). Never use ORM-generated migrations -- the schema is the spec's recommended design and should be maintained as explicit SQL.

### Index Tuning

The compound filtering workload (Pillar 2) drives these critical indexes:

```sql
-- Mechanic filtering (AND/OR/NOT queries join through this table)
CREATE INDEX idx_game_mechanics_mechanic ON game_mechanics(mechanic_id);

-- Compound sort (most common: rating desc with minimum vote count)
CREATE INDEX idx_games_rating ON games(rating DESC, rating_votes DESC);

-- Full-text search (weighted: name > short desc > full desc)
CREATE INDEX idx_games_search ON games USING GIN(search_vector);

-- Year-based trend queries
CREATE INDEX idx_games_year ON games(year_published);
```

Monitor slow queries with `pg_stat_statements` and run `EXPLAIN ANALYZE` on your compound filter queries to verify index usage.

### Backup

- **Automated daily backups** with point-in-time recovery (PITR) using WAL archiving
- **Test restores monthly** -- a backup you have not restored is not a backup
- Managed services (AWS RDS, Cloud SQL, Supabase) handle this automatically

## Materialization Jobs

The Game entity's aggregate fields (`rating`, `rating_confidence`, `rank_overall`, etc.) are **materialized** from raw input data -- not computed on every API request. See [Materialization](../pillars/data-model/materialization.md) for the full architectural rationale. In production, a scheduled job performs this materialization.

### Execution Order

The materialization must run in dependency order:

1. **Per-game aggregates first** -- `rating`, `rating_votes`, `rating_distribution`, `rating_stddev`, `weight`, `weight_votes`, `community_playtime_*`, `community_suggested_age`, `owner_count`, `wishlist_count`, `total_plays`, experience multipliers
2. **Global parameters second** -- Compute the global mean rating from the freshly-updated per-game averages
3. **Rating confidence third** -- `rating_confidence` is the spec-level trust signal ([rating-model.md](../pillars/data-model/rating-model.md) Layer 3), computed from sample size, distribution shape, and deviation from global mean
4. **Rankings fourth** -- `rank_overall` computed using an implementation-chosen ranking method (Layer 4 recommends Dirichlet-prior Bayesian)
5. **Derived fields fifth** -- `top_player_counts`, `recommended_player_counts` from per-count ratings
6. **Snapshots last** -- Write `GameSnapshot` rows as a side effect of materialization ([ADR-0036](../adr/0036-time-series-snapshots-and-trend-analysis.md))

Steps 1-3 can be parallelized per-game. Step 4 is a single global sort.

### Idempotency

The materialization job must be **idempotent** -- safe to re-run at any time without producing incorrect results. Each run reads the current Tier 1 data and overwrites Tier 2 fields. Running the job twice with no new votes produces identical output. This means you can safely retry on failure, run manually for debugging, or trigger an extra run after a bulk data import.

### Kubernetes CronJob

Schedule the materialization as a Kubernetes CronJob that runs daily at a low-traffic hour:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: opentabletop-materialize
spec:
  schedule: "0 4 * * *"   # Daily at 04:00 UTC
  concurrencyPolicy: Forbid  # Never run two at once
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 3600  # Kill if stuck for 1 hour
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: materialize
              image: ghcr.io/your-org/opentabletop:abc1234
              command: ["node", "dist/jobs/materialize.js"]
              envFrom:
                - configMapRef:
                    name: opentabletop-config
                - secretRef:
                    name: opentabletop-secrets
              resources:
                requests:
                  cpu: 500m
                  memory: 512Mi
                limits:
                  cpu: "2"
                  memory: 1Gi
```

Key settings:
- **`concurrencyPolicy: Forbid`** prevents overlapping runs if a previous job is still in progress.
- **`activeDeadlineSeconds`** kills a stuck job before the next scheduled run.
- **`backoffLimit: 2`** retries on transient failures (safe because the job is idempotent).

Replace the `command` with your implementation's materialization entrypoint (e.g., `cargo run --bin materialize` for Rust, `python -m opentabletop.materialize` for Python).

### Manual Trigger

The demo API exposes `POST /v1/admin/materialize` for manual triggering -- useful after bulk data imports or during development. This endpoint runs the same logic as the cron job. In production, protect it with admin-only authentication.

## Observability

Instrument your server with OpenTelemetry ([ADR-0023](../adr/0023-opentelemetry-observability.md)). The three signals:

### Metrics (Prometheus)

Expose a `/metrics` endpoint with at minimum:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total requests by method, path, status |
| `http_request_duration_seconds` | Histogram | Request latency by endpoint |
| `db_query_duration_seconds` | Histogram | Database query latency |
| `db_connections_active` | Gauge | Current active DB connections |
| `cache_hits_total` / `cache_misses_total` | Counter | Redis cache effectiveness |
| `export_requests_active` | Gauge | In-flight bulk export streams |

### Logs (Structured JSON)

Every log line should include:

```json
{"level":"info","msg":"request completed","method":"GET","path":"/v1/games","status":200,"duration_ms":42,"trace_id":"abc123"}
```

The `trace_id` correlates logs to distributed traces. Use a log aggregator (Loki, CloudWatch, Datadog) to search and alert.

### Traces (OTLP)

Configure the OTEL SDK to export traces to your collector. Instrument at minimum:
- HTTP handler spans (automatic with most frameworks)
- Database query spans (manual or via instrumented client)
- Cache lookup spans

For production, sample at 10-25% to control costs while maintaining visibility into tail latency.

### Suggested Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | 5xx rate > 1% for 5 minutes | Critical |
| Slow responses | p95 latency > 2s for 5 minutes | Warning |
| DB connections saturated | Active > 80% of max for 5 minutes | Warning |
| Export queue backing up | Active exports > 5 for 10 minutes | Warning |
| Pod restarts | > 3 restarts in 15 minutes | Critical |

## Sizing & Capacity Planning

Reference sizing for a dataset of ~100,000 games with full taxonomy, polls, and snapshots:

| Tier | Pods | CPU/Pod | Memory/Pod | PostgreSQL | Redis | Expected QPS |
|------|------|---------|------------|------------|-------|-------------|
| **Small** (hobby) | 1 | 0.5 vCPU | 512 MB | Micro (2 vCPU, 1 GB) | None | < 10 |
| **Medium** (community) | 2-3 | 1 vCPU | 1 GB | Small (2 vCPU, 2 GB) | Micro | 10-100 |
| **Large** (platform) | 3-10 | 2 vCPU | 2 GB | Large (2 vCPU, 16 GB) + replica | Large | 100-1000 |

### Storage Growth

| Data Type | Per Game | 100k Games | Growth Rate |
|-----------|----------|------------|-------------|
| Game records | ~2 KB | ~200 MB | Slow (new publications) |
| Player count ratings | ~200 B | ~20 MB | Moderate (new votes) |
| Game snapshots (monthly) | ~500 B x 12/yr | ~600 MB/year | Linear |
| Full-text index | ~1 KB | ~100 MB | Tracks game records |
| **Total (year 1)** | | **~1 GB** | |

PostgreSQL handles this comfortably. You will hit CPU limits on compound filtering queries long before you hit storage limits.

## Security Checklist

- [ ] **TLS everywhere** -- Terminate at ingress or load balancer. No plaintext HTTP in production.
- [ ] **API keys hashed** -- Store HMAC hashes, not plaintext keys ([ADR-0016](../adr/0016-api-key-auth-tiered-rate-limits.md)).
- [ ] **Rate limiting enforced** -- 60/min anonymous, 600/min authenticated.
- [ ] **CORS restricted** -- Set `CORS_ORIGINS` to your known frontends. Do not leave `*` in production.
- [ ] **Database not publicly accessible** -- Private subnets, security groups, or network policies.
- [ ] **Secrets in Secret store** -- `DATABASE_URL` and `API_KEY_SALT` in Kubernetes Secrets (or Vault/SOPS), never in ConfigMap or image.
- [ ] **Container image scanned** -- Run Trivy or Grype in CI. Block deployment on critical CVEs.
- [ ] **No shell in runtime image** -- Distroless images have no shell to exploit.

## Production Checklist

Before going live:

- [ ] Schema migrations applied and verified
- [ ] Sample data or real data loaded and queryable
- [ ] Health endpoints (`/healthz`, `/readyz`) responding
- [ ] Metrics endpoint (`/metrics`) scraped by Prometheus
- [ ] Structured JSON logs flowing to aggregator
- [ ] Traces sampled and visible in backend
- [ ] HPA configured and tested under load
- [ ] PodDisruptionBudget set (`minAvailable: 1`)
- [ ] Database backups configured and restore tested
- [ ] TLS certificate provisioned and auto-renewing
- [ ] Rate limiting verified (test both anonymous and authenticated tiers)
- [ ] Rolling update tested (deploy a new image, verify zero downtime)
- [ ] Rollback tested (revert to previous SHA, verify recovery)
- [ ] Alert rules configured and notification channel verified
