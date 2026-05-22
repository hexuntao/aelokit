# AeloKit v0.5 Credits State Machine

Status: Approved for implementation
Date: 2026-05-22

## Current Decision

v0.4 embedding blocker is ignored for v0.5. The state machine below only covers
usage, cost, credits, and admin audit.

## Billing Modes

- `audit_only`: record usage/cost audit facts only; do not reserve or settle
  credits.
- `credits`: run credits preflight, reservation, settlement, refund, or
  no-charge handling.

## Billing Statuses

- `audit_only`
- `preflight_passed`
- `preflight_failed`
- `reserved`
- `reservation_failed`
- `settled`
- `settlement_failed`
- `refunded`
- `refund_failed`
- `no_charge`
- `cancelled`
- `timeout`
- `rate_limited`

## Normal Flow

```txt
request accepted
  -> usage context created
  -> preflight_passed
  -> reserved
  -> stream completed successfully
  -> usage audit recorded
  -> cost event recorded
  -> settled
```

Settlement is the only step that can create a final AI usage credits
transaction.

## Audit-Only Flow

```txt
AI_CREDITS_BILLING_ENABLED=false
  -> audit_only
  -> stream completed or failed
  -> usage audit recorded with billingMode=audit_only
  -> no credits reservation
  -> no credits settlement
```

## Preflight Failure

```txt
request accepted
  -> usage context created
  -> preflight_failed
  -> usage audit recorded
  -> response rejected before streaming
  -> no credits reservation
  -> no credits settlement
```

## Reservation Failure

```txt
request accepted
  -> usage context created
  -> preflight_passed
  -> reservation_failed
  -> usage audit recorded
  -> response rejected before streaming
  -> no credits settlement
```

## Failed / Aborted / Timeout / Rate-Limited Stream

```txt
reserved
  -> stream failed, aborted, timed out, or was rate limited
  -> refund if already settled
  -> no_charge if no final settlement occurred
  -> usage audit records final billing status
```

## Idempotency

- Repeating settlement for an already settled reservation returns the existing
  settled status and must not write another credits usage transaction.
- Repeating refund for an already refunded reservation returns the existing
  refunded status and must not write another refund transaction.
- A reservation without a reservation id cannot be settled.

## Admin Audit Visibility

Admin usage audit can display metadata, tokens, cost estimates, billing mode,
billing status, reservation status, settlement status, refund status, and
failure reason. It does not return raw message content by default.

