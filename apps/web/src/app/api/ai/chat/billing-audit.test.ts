import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAIChatBillingReference,
  resolveAIChatRefundOutcome,
  resolveAIChatRouteErrorBillingOutcome,
} from './billing-audit';

test('failed or aborted request release is explicit in billing reference', () => {
  const outcome = resolveAIChatRefundOutcome('cancelled');
  const reference = getAIChatBillingReference({
    usageId: 'usage-release',
    reservationId: 'reservation-release',
    releasedCredits: 3,
    billingAction: outcome.billingAction,
  });

  assert.equal(outcome.billingStatus, 'no_charge');
  assert.equal(outcome.billingAction, 'released');
  assert.equal(reference.releasedCredits, 3);
  assert.equal(reference.billingAction, 'released');
});

test('route error refund success is reported as refunded instead of generic no_charge', () => {
  const outcome = resolveAIChatRouteErrorBillingOutcome({
    creditsBillingEnabled: true,
    hasReservation: true,
    refundSucceeded: true,
    refundStatus: 'refunded',
  });

  assert.equal(outcome.billingStatus, 'refunded');
  assert.equal(outcome.billingAction, 'refunded');
});

test('route error refund failure remains auditable as refund_failed', () => {
  const outcome = resolveAIChatRouteErrorBillingOutcome({
    creditsBillingEnabled: true,
    hasReservation: true,
    refundSucceeded: false,
  });

  assert.equal(outcome.billingStatus, 'refund_failed');
  assert.equal(outcome.billingAction, 'refund_failed');
});

test('audit-only route errors remain audit-only without a reservation', () => {
  const outcome = resolveAIChatRouteErrorBillingOutcome({
    creditsBillingEnabled: false,
    hasReservation: false,
  });

  assert.equal(outcome.billingStatus, 'audit_only');
  assert.equal(outcome.billingAction, 'audit_only');
});
