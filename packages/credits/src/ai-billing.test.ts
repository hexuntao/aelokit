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
  let reservationWrites = 0;
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
      if (balance < params.requiredCredits) {
        return {
          success: false,
          error: {
            code: 'insufficient_credits',
            message: 'Insufficient credits.',
            retryable: false,
          },
        };
      }

      balance -= params.requiredCredits;
      reservationWrites += 1;
      const reservation = createReservationRecord({
        id: params.reservationId,
        usageId: params.usageId,
        userId: params.userId,
        credits: params.requiredCredits,
        now,
      });
      reservations.set(reservation.id, reservation);
      return { success: true, data: reservation };
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

      const settledCredits = Math.min(
        params.settledCredits,
        reservation.reservedCredits
      );
      const releasedCredits = Math.max(
        0,
        reservation.reservedCredits - settledCredits
      );
      if (releasedCredits > 0) {
        balance += releasedCredits;
      }
      settlementWrites += 1;
      const settled: AICreditReservationRecord = {
        ...reservation,
        settlementStatus: 'settled',
        settledCredits,
        refundStatus: releasedCredits > 0 ? 'refunded' : reservation.refundStatus,
        refundedCredits: releasedCredits > 0 ? releasedCredits : reservation.refundedCredits,
        refundedAt: releasedCredits > 0 ? now : reservation.refundedAt,
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
        balance += reservation.reservedCredits;
        const noCharge: AICreditReservationRecord = {
          ...reservation,
          reservationStatus: 'cancelled',
          settlementStatus: 'no_charge',
          refundStatus: 'refunded',
          refundedCredits: reservation.reservedCredits,
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
    getReservationWrites: () => reservationWrites,
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
  assert.equal(store.getBalance(), 7);
  assert.equal(store.getReservationWrites(), 1);
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
  assert.equal(store.getBalance(), 7);
  assert.equal(store.getSettlementWrites(), 1);
});

test('settleAICredits caps overage to reserved credits', async () => {
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

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.settledCredits, 3);
  }
  assert.equal(store.getBalance(), 0);
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

test('settleAICredits releases unused reserved credits back to balance', async () => {
  const store = createMemoryDependencies(10);
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 5 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) return;

  const result = await settleAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-1',
      userId: 'user-1',
      settledCredits: 3,
    },
    store.dependencies
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.settledCredits, 3);
    assert.equal(result.data.refundStatus, 'refunded');
    assert.equal(result.data.refundedCredits, 2);
  }
  assert.equal(store.getBalance(), 7);
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
    assert.equal(refund.data.refundStatus, 'refunded');
    assert.equal(refund.data.settlementStatus, 'no_charge');
    assert.equal(refund.data.refundedCredits, 3);
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
    assert.equal(refund.data.refundStatus, 'refunded');
    assert.equal(refund.data.failureReason, 'aborted');
  }
  assert.equal(store.getBalance(), 10);
});
