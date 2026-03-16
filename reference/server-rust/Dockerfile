# Stage 1: Build
FROM rust:1.85-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src/ src/
COPY migrations/ migrations/

RUN cargo build --release

# Stage 2: Runtime (distroless — minimal attack surface, no shell)
FROM gcr.io/distroless/cc-debian12:nonroot

COPY --from=builder /app/target/release/opentabletop-server /usr/local/bin/server

# 12-factor: port binding via env var
ENV PORT=8080
EXPOSE 8080

# Health check endpoints: /healthz (liveness), /readyz (readiness)
# Graceful shutdown on SIGTERM

ENTRYPOINT ["/usr/local/bin/server"]
