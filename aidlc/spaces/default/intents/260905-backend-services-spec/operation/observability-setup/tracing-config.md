# Observability Setup — Tracing Configuration

Conversation language: English

## Design (from `observability-design.md`, `monitoring-design.md`)

An ADOT (AWS Distro for OpenTelemetry) collector sidecar container in each
ECS task, exporting traces to AWS X-Ray, propagating W3C Trace Context
across the one real inter-service boundary (`admin-api` → `backend-api`).
Sampling: 100% error traces, 10% baseline.

## Current implementation status: not built (Q1 — minimal slice)

Not implemented this pass. What exists today:

- `src/lib/otel.ts` — a real OpenTelemetry SDK integration, but
  `OTEL_ENABLED` is `false` in production (never actually exported
  anything to any backend)
- `admin-api/src/lib/traceContext.ts` — a dependency-free W3C `traceparent`
  header generator wired into `admin-api`'s outbound internal calls (added
  during Build and Test, Fix 5) — the propagation half of the design is
  real; there's just nothing on `u1-backend-api`'s side consuming/exporting
  it to a tracing backend yet

## What implementing this later requires

1. Add an ADOT collector sidecar container to `PublicService`'s task
   definition (a `TaskDefinition.addContainer()` addition in
   `backend-api-stack.ts`, plus the IAM permissions for it to write to
   X-Ray)
2. Set `OTEL_ENABLED=true` and point `OTEL_EXPORTER_OTLP_ENDPOINT` at the
   sidecar's local listener
3. Verify traces actually appear in the X-Ray console, spanning from an
   `admin-api` internal call through to `backend-api`'s handling of it
4. Add the sampling configuration (100% error / 10% baseline) at the
   collector

No X-Ray IAM role, sidecar container, or trace export currently exists in
the deployed stack.
