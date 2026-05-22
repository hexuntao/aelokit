# AeloKit v0.6 App Decision Matrix

## Scoring

- `0` = none
- `1` = low
- `2` = medium
- `3` = high

High runtime pressure or security boundary does not automatically mean `Create now`. A new app also needs business maturity, shared package readiness, route ownership, deployment ownership, and explicit user confirmation.

## Matrix

| App | Runtime pressure | Security boundary | Deploy cadence | Route complexity | Business maturity | Shared package readiness | Migration risk | Implementation cost | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `apps/worker` | 3 | 2 | 2 | 1 | 2 | 2 | 2 | 3 | Prepare next |
| `apps/gateway` | 2 | 3 | 3 | 2 | 1 | 1 | 3 | 3 | Defer |
| `apps/admin` | 1 | 3 | 2 | 2 | 2 | 2 | 2 | 2 | Prepare next |
| `apps/studio` | 2 | 2 | 2 | 2 | 1 | 1 | 3 | 3 | Defer |
| `apps/landing` | 0 | 0 | 2 | 2 | 2 | 1 | 2 | 2 | Defer |
| `apps/docs` | 1 | 0 | 2 | 2 | 2 | 2 | 2 | 2 | Prepare next |
| `apps/observability` | 1 | 3 | 2 | 1 | 0 | 0 | 2 | 3 | Reject for now |

## Decision Notes

### Create now

None.

No candidate has enough confirmed package readiness, route ownership, deployment ownership, and user confirmation to justify directory creation in v0.6.

### Prepare next

- `apps/worker`: strongest runtime-pressure case, but needs job runtime, idempotency, queue/deploy target, and v0.5 runtime rollout confirmation.
- `apps/admin`: strongest current-source and security-boundary case, but must resolve strict admin access, audit redaction, and package-safe service boundaries first.
- `apps/docs`: clear content surface, but needs search, locale, redirects, and Fumadocs dependency plan before split.

### Defer

- `apps/gateway`: high security boundary, but public API contracts, rate limits, API key policy, usage/billing readiness, and gateway SLA are not mature enough.
- `apps/studio`: product surface is not mature, and v0.4 tool/MCP permissions plus `@repo/ai` builder contracts are not enough to support an app yet.
- `apps/landing`: low runtime pressure; split only after marketing/SEO deploy cadence diverges or design-system extraction makes migration cheap.

### Reject for now

- `apps/observability`: no current telemetry data model, no logger/observability package, and no redaction/retention policy. Re-evaluate after operational telemetry exists.

## App Creation Prerequisites

Every future app creation task must provide:

- Confirmed app name and route ownership.
- Files/routes/jobs to move or create.
- Allowed and forbidden package dependencies.
- Auth/session strategy.
- Env and secret strategy.
- i18n strategy if user-facing.
- Analytics/observability strategy.
- Deployment target and root directory.
- Redirect/backward compatibility plan.
- Validation commands.
- Explicit user confirmation to create the app directory.
