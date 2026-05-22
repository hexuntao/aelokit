import assert from 'node:assert/strict';
import test from 'node:test';
import {
  preflightAICredits,
  refundAICredits,
  reserveAICredits,
  settleAICredits,
  type AICreditBillingDependencies,
  type AICreditReservationRecord,
} from './ai-billing';

function createReservationRecord(options: {
  readonly id: string;
  readonly usageId: string;
  readonly userId: string;
  readonly credits: number;
  readonly now: Date;
}): AICreditReservationRecord {
  return {
    id: options.id,
    usageId: options.usageId,
    userId: options.userId,
    reservationStatus: 'reserved',
    settlementStatus: 'pending',
    refundStatus: 'not_required',
    reservedCredits: options.credits,
    expiresAt: new Date(options.now.getTime() + 60_000),
    reservedAt: options.now,
    createdAt: options.now,
    updatedAt: options.now,
  };
}

function createMemoryDependencies(initialBalance: number) {
  let balance = initialBalance;
  let settlementWrites = 0;
  let refundWrites = 0;
  const now = new Date('2026-05-22T00:00:00.000Z');
  const reservations = new Map<string, AICreditReservationRecord>();

  const dependencies: AICreditBillingDependencies = {
    now: () => now,
    getBalance: async () => balance,
    findReservationById: async (reservationId) =>
      reservations.get(reservationId) ?? null,
    findReservationByUsageId: async (usageId) =>
      [...reservations.values()].find(
        (reservation) => reservation.usageId === usageId
      ) ?? null,
    createReservation: async (params) => {
      const reservation = createReservationRecord({
        id: params.reservationId,
        usageId: params.usageId,
        userId: params.userId,
        credits: params.requiredCredits,
        now,
      });
      reservations.set(reservation.id, reservation);
      return reservation;
    },
    settleReservation: async (params) => {
      const reservation = reservations.get(params.reservationId);
      if (!reservation) {
        return {
          success: false,
          error: {
            code: 'reservation_not_found',
            message: 'Reservation not found.',
            retryable: false,
          },
        };
      }

      if (reservation.settlementStatus === 'settled') {
        return { success: true, data: reservation };
      }

      if (balance < params.settledCredits) {
        const failed: AICreditReservationRecord = {
          ...reservation,
          settlementStatus: 'settlement_failed',
          failureReason: 'insufficient_credits',
          updatedAt: now,
        };
        reservations.set(failed.id, failed);
        return {
          success: false,
          error: {
            code: 'insufficient_credits',
            message: 'Insufficient credits.',
            retryable: false,
          },
        };
      }

      balance -= params.settledCredits;
      settlementWrites += 1;
      const settled: AICreditReservationRecord = {
        ...reservation,
        settlementStatus: 'settled',
        settledCredits: params.settledCredits,
        settledAt: now,
        updatedAt: now,
      };
      reservations.set(settled.id, settled);
      return { success: true, data: settled };
    },
    refundReservation: async (params) => {
      const reservation = reservations.get(params.reservationId);
      if (!reservation) {
        return {
          success: false,
          error: {
            code: 'reservation_not_found',
            message: 'Reservation not found.',
            retryable: false,
          },
        };
      }

      if (reservation.refundStatus === 'refunded') {
        return { success: true, data: reservation };
      }

      if (reservation.settlementStatus !== 'settled') {
        const noCharge: AICreditReservationRecord = {
          ...reservation,
          reservationStatus: 'cancelled',
          settlementStatus: 'no_charge',
          refundStatus: 'no_charge',
          refundedCredits: 0,
          refundedAt: now,
          failureReason: params.reason,
          updatedAt: now,
        };
        reservations.set(noCharge.id, noCharge);
        return { success: true, data: noCharge };
      }

      const creditsToRefund =
        reservation.settledCredits ?? reservation.reservedCredits;
      balance += creditsToRefund;
      refundWrites += 1;
      const refunded: AICreditReservationRecord = {
        ...reservation,
        refundStatus: 'refunded',
        refundedCredits: creditsToRefund,
        refundedAt: now,
        failureReason: params.reason,
        updatedAt: now,
      };
      reservations.set(refunded.id, refunded);
      return { success: true, data: refunded };
    },
  };

  return {
    dependencies,
    getBalance: () => balance,
    getSettlementWrites: () => settlementWrites,
    getRefundWrites: () => refundWrites,
  };
}

test('preflightAICredits succeeds when balance covers required credits', async () => {
  const store = createMemoryDependencies(10);

  const result = await preflightAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.status, 'preflight_passed');
    assert.equal(result.data.currentCredits, 10);
  }
});

test('preflightAICredits fails when balance is insufficient', async () => {
  const store = createMemoryDependencies(2);

  const result = await preflightAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, 'insufficient_credits');
  }
});

test('reserveAICredits creates a reservation after successful preflight', async () => {
  const store = createMemoryDependencies(10);

  const result = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.reservationStatus, 'reserved');
    assert.equal(result.data.reservedCredits, 3);
  }
});

test('reserveAICredits fails when preflight fails', async () => {
  const store = createMemoryDependencies(1);

  const result = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, 'insufficient_credits');
  }
});

test('settleAICredits settles once and duplicate settlement is idempotent', async () => {
  const store = createMemoryDependencies(10);
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) return;

  const first = await settleAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      settledCredits: 4,
    },
    store.dependencies
  );
  const second = await settleAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      settledCredits: 4,
    },
    store.dependencies
  );

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.equal(store.getBalance(), 6);
  assert.equal(store.getSettlementWrites(), 1);
});

test('settleAICredits fails without enough credits', async () => {
  const store = createMemoryDependencies(3);
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) return;

  const result = await settleAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      settledCredits: 4,
    },
    store.dependencies
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, 'insufficient_credits');
  }
});

test('refundAICredits refunds settled usage once', async () => {
  const store = createMemoryDependencies(10);
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) return;

  await settleAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      settledCredits: 3,
    },
    store.dependencies
  );

  const first = await refundAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      reason: 'stream_failed',
    },
    store.dependencies
  );
  const second = await refundAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      reason: 'stream_failed',
    },
    store.dependencies
  );

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.equal(store.getBalance(), 10);
  assert.equal(store.getRefundWrites(), 1);
});

test('refundAICredits fails for missing reservation', async () => {
  const store = createMemoryDependencies(10);

  const result = await refundAICredits(
    {
      reservationId: 'missing',
      usageId: 'usage-1',
      userId: 'user-1',
      reason: 'stream_failed',
    },
    store.dependencies
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, 'reservation_not_found');
  }
});

test('failed stream before settlement becomes no_charge and does not charge', async () => {
  const store = createMemoryDependencies(10);
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) return;

  const refund = await refundAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      reason: 'stream_failed',
    },
    store.dependencies
  );

  assert.equal(refund.success, true);
  if (refund.success) {
    assert.equal(refund.data.refundStatus, 'no_charge');
    assert.equal(refund.data.settlementStatus, 'no_charge');
  }
  assert.equal(store.getBalance(), 10);
  assert.equal(store.getSettlementWrites(), 0);
});

test('aborted stream before settlement is no_charge', async () => {
  const store = createMemoryDependencies(10);
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) return;

  const refund = await refundAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      reason: 'aborted',
    },
    store.dependencies
  );

  assert.equal(refund.success, true);
  if (refund.success) {
    assert.equal(refund.data.refundStatus, 'no_charge');
    assert.equal(refund.data.failureReason, 'aborted');
  }
  assert.equal(store.getBalance(), 10);
});
