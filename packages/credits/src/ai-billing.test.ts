import assert from 'node:assert/strict';
import test from 'node:test';
import {
  preflightAICredits,
  refundAICredits,
  reserveAICredits,
  settleAICredits,
  type AICreditAllocation,
  type AICreditBillingDependencies,
  type AICreditReservationRecord,
} from './ai-billing';

type MemoryEarnTransaction = {
  readonly id: string;
  readonly remainingAmount: number;
  readonly expirationDate?: Date;
  readonly createdAt: Date;
};

function splitAllocations(
  allocations: readonly AICreditAllocation[],
  settledCredits: number
) {
  let remainingToSettle = settledCredits;
  const settled: AICreditAllocation[] = [];
  const released: AICreditAllocation[] = [];

  for (const allocation of allocations) {
    if (remainingToSettle <= 0) {
      released.push(allocation);
      continue;
    }

    const settledAmount = Math.min(allocation.amount, remainingToSettle);
    if (settledAmount > 0) {
      settled.push({
        ...allocation,
        amount: settledAmount,
      });
    }

    const releasedAmount = allocation.amount - settledAmount;
    if (releasedAmount > 0) {
      released.push({
        ...allocation,
        amount: releasedAmount,
      });
    }

    remainingToSettle -= settledAmount;
  }

  return { settled, released };
}

function createReservationRecord(options: {
  readonly id: string;
  readonly usageId: string;
  readonly userId: string;
  readonly credits: number;
  readonly now: Date;
  readonly creditAllocations: readonly AICreditAllocation[];
}): AICreditReservationRecord {
  return {
    id: options.id,
    usageId: options.usageId,
    userId: options.userId,
    reservationStatus: 'reserved',
    settlementStatus: 'pending',
    refundStatus: 'not_required',
    reservedCredits: options.credits,
    creditAllocations: options.creditAllocations,
    expiresAt: new Date(options.now.getTime() + 60_000),
    reservedAt: options.now,
    createdAt: options.now,
    updatedAt: options.now,
  };
}

function createLedgerStore(options?: {
  readonly now?: Date;
  readonly earnTransactions?: readonly MemoryEarnTransaction[];
  readonly duplicateUsageIdOnCreate?: string;
  readonly seedReservations?: readonly AICreditReservationRecord[];
}) {
  const now = options?.now ?? new Date('2026-05-22T00:00:00.000Z');
  const earnTransactions = new Map(
    (
      options?.earnTransactions ?? [
        {
          id: 'credit-a',
          remainingAmount: 10,
          expirationDate: new Date('2026-06-01T00:00:00.000Z'),
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ]
    ).map((transaction) => [transaction.id, { ...transaction }])
  );
  const reservations = new Map(
    (options?.seedReservations ?? []).map((reservation) => [
      reservation.id,
      reservation,
    ])
  );
  let reservationWrites = 0;
  let settlementWrites = 0;
  let refundWrites = 0;
  let duplicateTriggered = false;

  function getBalance() {
    return [...earnTransactions.values()]
      .filter(
        (transaction) =>
          !transaction.expirationDate || transaction.expirationDate > now
      )
      .reduce(
        (sum, transaction) => sum + Math.max(0, transaction.remainingAmount),
        0
      );
  }

  function getSortedSpendableTransactions() {
    return [...earnTransactions.values()]
      .filter(
        (transaction) =>
          transaction.remainingAmount > 0 &&
          (!transaction.expirationDate || transaction.expirationDate > now)
      )
      .sort((left, right) => {
        const leftExpiresAt =
          left.expirationDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightExpiresAt =
          right.expirationDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return (
          leftExpiresAt - rightExpiresAt ||
          left.createdAt.getTime() - right.createdAt.getTime()
        );
      });
  }

  function restoreAllocations(allocations: readonly AICreditAllocation[]) {
    for (const allocation of allocations) {
      const transaction = earnTransactions.get(allocation.transactionId);
      assert.ok(transaction, `Missing transaction ${allocation.transactionId}`);
      if (allocation.expirationDate && allocation.expirationDate <= now) {
        continue;
      }
      earnTransactions.set(allocation.transactionId, {
        ...transaction,
        remainingAmount: transaction.remainingAmount + allocation.amount,
      });
    }
  }

  const dependencies: AICreditBillingDependencies = {
    now: () => now,
    getBalance: async () => getBalance(),
    findReservationById: async (reservationId) =>
      reservations.get(reservationId) ?? null,
    findReservationByUsageId: async (usageId) =>
      [...reservations.values()].find(
        (reservation) => reservation.usageId === usageId
      ) ?? null,
    createReservation: async (params) => {
      if (getBalance() < params.requiredCredits) {
        return {
          success: false,
          error: {
            code: 'insufficient_credits',
            message: 'Insufficient credits.',
            retryable: false,
          },
        };
      }

      let remainingToDeduct = params.requiredCredits;
      const allocations: AICreditAllocation[] = [];
      for (const transaction of getSortedSpendableTransactions()) {
        if (remainingToDeduct <= 0) {
          break;
        }

        const deductedAmount = Math.min(
          transaction.remainingAmount,
          remainingToDeduct
        );
        if (deductedAmount <= 0) {
          continue;
        }

        earnTransactions.set(transaction.id, {
          ...transaction,
          remainingAmount: transaction.remainingAmount - deductedAmount,
        });
        allocations.push({
          transactionId: transaction.id,
          amount: deductedAmount,
          expirationDate: transaction.expirationDate,
        });
        remainingToDeduct -= deductedAmount;
      }

      assert.equal(remainingToDeduct, 0);

      reservationWrites += 1;
      const reservation = createReservationRecord({
        id: params.reservationId,
        usageId: params.usageId,
        userId: params.userId,
        credits: params.requiredCredits,
        now,
        creditAllocations: allocations,
      });
      reservations.set(reservation.id, reservation);

      if (
        options?.duplicateUsageIdOnCreate === params.usageId &&
        !duplicateTriggered
      ) {
        duplicateTriggered = true;
        throw Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        );
      }

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

      if (reservation.refundStatus === 'refunded') {
        return {
          success: false,
          error: {
            code: 'already_refunded',
            message: 'Cannot settle an already refunded reservation.',
            retryable: false,
          },
        };
      }

      const settledCredits = Math.min(
        params.settledCredits,
        reservation.reservedCredits
      );
      const { released } = splitAllocations(
        reservation.creditAllocations,
        settledCredits
      );
      const releasedCredits = released.reduce(
        (sum, allocation) => sum + allocation.amount,
        0
      );

      if (releasedCredits > 0) {
        restoreAllocations(released);
      }

      settlementWrites += 1;
      const settled: AICreditReservationRecord = {
        ...reservation,
        settlementStatus: 'settled',
        settledCredits,
        releasedCredits,
        refundStatus: reservation.refundStatus,
        refundedCredits: reservation.refundedCredits,
        refundedAt: reservation.refundedAt,
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

      if (
        reservation.settlementStatus !== 'settled' &&
        (reservation.refundStatus === 'cancelled' ||
          reservation.refundStatus === 'no_charge')
      ) {
        return { success: true, data: reservation };
      }

      if (reservation.settlementStatus !== 'settled') {
        const activeAllocations = reservation.creditAllocations.filter(
          (allocation) =>
            !allocation.expirationDate || allocation.expirationDate > now
        );
        restoreAllocations(activeAllocations);
        const noCharge: AICreditReservationRecord = {
          ...reservation,
          reservationStatus: 'cancelled',
          settlementStatus: 'no_charge',
          refundStatus: 'cancelled',
          refundedCredits: activeAllocations.reduce(
            (sum, allocation) => sum + allocation.amount,
            0
          ),
          refundedAt: now,
          failureReason: params.reason,
          updatedAt: now,
        };
        reservations.set(noCharge.id, noCharge);
        refundWrites += 1;
        return { success: true, data: noCharge };
      }

      const { settled } = splitAllocations(
        reservation.creditAllocations,
        reservation.settledCredits ?? reservation.reservedCredits
      );
      restoreAllocations(settled);
      refundWrites += 1;
      const refunded: AICreditReservationRecord = {
        ...reservation,
        refundStatus: 'refunded',
        refundedCredits: settled.reduce(
          (sum, allocation) => sum + allocation.amount,
          0
        ),
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
    getBalance,
    getReservationWrites: () => reservationWrites,
    getSettlementWrites: () => settlementWrites,
    getRefundWrites: () => refundWrites,
    getReservationByUsageId: (usageId: string) =>
      [...reservations.values()].find(
        (reservation) => reservation.usageId === usageId
      ),
    getRemainingAmount: (transactionId: string) =>
      earnTransactions.get(transactionId)?.remainingAmount,
    simulateExpirationJob: () => {
      let expiredAmount = 0;
      for (const transaction of earnTransactions.values()) {
        if (
          transaction.expirationDate &&
          transaction.expirationDate <= now &&
          transaction.remainingAmount > 0
        ) {
          expiredAmount += transaction.remainingAmount;
          earnTransactions.set(transaction.id, {
            ...transaction,
            remainingAmount: 0,
          });
        }
      }
      return expiredAmount;
    },
  };
}

test('preflightAICredits succeeds when balance covers required credits', async () => {
  const store = createLedgerStore();

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
  const store = createLedgerStore({
    earnTransactions: [
      {
        id: 'credit-a',
        remainingAmount: 2,
        expirationDate: new Date('2026-06-01T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ],
  });

  const result = await preflightAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, 'insufficient_credits');
  }
});

test('reserveAICredits records FIFO allocations that can be traced', async () => {
  const store = createLedgerStore({
    earnTransactions: [
      {
        id: 'credit-expiring-soon',
        remainingAmount: 2,
        expirationDate: new Date('2026-05-30T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'credit-later',
        remainingAmount: 4,
        expirationDate: new Date('2026-06-10T00:00:00.000Z'),
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ],
  });

  const result = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 5 },
    store.dependencies
  );

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.deepEqual(result.data.creditAllocations, [
    {
      transactionId: 'credit-expiring-soon',
      amount: 2,
      expirationDate: new Date('2026-05-30T00:00:00.000Z'),
    },
    {
      transactionId: 'credit-later',
      amount: 3,
      expirationDate: new Date('2026-06-10T00:00:00.000Z'),
    },
  ]);
  assert.equal(store.getRemainingAmount('credit-expiring-soon'), 0);
  assert.equal(store.getRemainingAmount('credit-later'), 1);
  assert.equal(store.getBalance(), 1);
  assert.equal(store.getReservationWrites(), 1);
});

test('settleAICredits releases only the unused tail of reserved allocations', async () => {
  const store = createLedgerStore({
    earnTransactions: [
      {
        id: 'credit-expiring-soon',
        remainingAmount: 4,
        expirationDate: new Date('2026-05-30T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'credit-later',
        remainingAmount: 4,
        expirationDate: new Date('2026-06-10T00:00:00.000Z'),
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ],
  });
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 6 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) {
    return;
  }

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
  if (!result.success) {
    return;
  }

  assert.equal(result.data.settledCredits, 3);
  assert.equal(result.data.releasedCredits, 3);
  assert.equal(result.data.refundStatus, 'not_required');
  assert.equal(result.data.refundedCredits, undefined);
  assert.equal(store.getRemainingAmount('credit-expiring-soon'), 1);
  assert.equal(store.getRemainingAmount('credit-later'), 4);
  assert.equal(store.getBalance(), 5);
});

test('refundAICredits can refund settled credits after partial settlement release', async () => {
  const store = createLedgerStore({
    earnTransactions: [
      {
        id: 'credit-expiring-soon',
        remainingAmount: 4,
        expirationDate: new Date('2026-05-30T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'credit-later',
        remainingAmount: 4,
        expirationDate: new Date('2026-06-10T00:00:00.000Z'),
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ],
  });
  const reservation = await reserveAICredits(
    { usageId: 'usage-partial-refund', userId: 'user-1', requiredCredits: 6 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) {
    return;
  }

  const settlement = await settleAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-partial-refund',
      userId: 'user-1',
      settledCredits: 3,
    },
    store.dependencies
  );
  assert.equal(settlement.success, true);
  if (!settlement.success) {
    return;
  }

  const refund = await refundAICredits(
    {
      reservationId: reservation.data.id,
      usageId: 'usage-partial-refund',
      userId: 'user-1',
      reason: 'user_refund',
    },
    store.dependencies
  );

  assert.equal(refund.success, true);
  if (!refund.success) {
    return;
  }

  assert.equal(refund.data.refundStatus, 'refunded');
  assert.equal(refund.data.refundedCredits, 3);
  assert.equal(store.getBalance(), 8);
  assert.equal(store.getRefundWrites(), 1);
});

test('settleAICredits is idempotent and caps overage to reserved credits', async () => {
  const store = createLedgerStore();
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) {
    return;
  }

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
  if (first.success) {
    assert.equal(first.data.settledCredits, 3);
  }
  assert.equal(store.getSettlementWrites(), 1);
  assert.equal(store.getBalance(), 7);
});

test('refundAICredits fully restores settled usage once', async () => {
  const store = createLedgerStore();
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) {
    return;
  }

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

test('refundAICredits returns no_charge before settlement', async () => {
  const store = createLedgerStore();
  const reservation = await reserveAICredits(
    { usageId: 'usage-1', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(reservation.success, true);
  if (!reservation.success) {
    return;
  }

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
    assert.equal(refund.data.settlementStatus, 'no_charge');
    assert.equal(refund.data.refundStatus, 'cancelled');
    assert.equal(refund.data.refundedCredits, 3);
    assert.equal(refund.data.failureReason, 'aborted');
  }
  assert.equal(store.getBalance(), 10);
});

test('reserveAICredits tolerates duplicate usageId unique violations', async () => {
  const store = createLedgerStore({
    duplicateUsageIdOnCreate: 'usage-duplicate',
  });

  const result = await reserveAICredits(
    {
      usageId: 'usage-duplicate',
      userId: 'user-1',
      requiredCredits: 3,
    },
    store.dependencies
  );

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(store.getReservationWrites(), 1);
  assert.equal(store.getBalance(), 7);
  assert.equal(
    store.getReservationByUsageId('usage-duplicate')?.id,
    result.data.id
  );
});

test('reserveAICredits returns an existing reservation before re-running preflight', async () => {
  const store = createLedgerStore({
    earnTransactions: [
      {
        id: 'credit-a',
        remainingAmount: 3,
        expirationDate: new Date('2026-06-01T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ],
  });

  const first = await reserveAICredits(
    { usageId: 'usage-repeat', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );
  assert.equal(first.success, true);
  if (!first.success) {
    return;
  }

  const second = await reserveAICredits(
    { usageId: 'usage-repeat', userId: 'user-1', requiredCredits: 3 },
    store.dependencies
  );

  assert.equal(second.success, true);
  if (!second.success) {
    return;
  }

  assert.equal(second.data.id, first.data.id);
  assert.equal(store.getReservationWrites(), 1);
  assert.equal(store.getBalance(), 0);
});

test('refundAICredits fails for missing reservation', async () => {
  const store = createLedgerStore();

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

test('expired transactions are restored to their original allocation without becoming spendable', async () => {
  const reservationRecord = createReservationRecord({
    id: 'reservation-expired-credit',
    usageId: 'usage-expired-credit',
    userId: 'user-1',
    credits: 2,
    now: new Date('2026-05-31T00:00:00.000Z'),
    creditAllocations: [
      {
        transactionId: 'credit-expired-after-reservation',
        amount: 2,
        expirationDate: new Date('2026-06-01T00:00:00.000Z'),
      },
    ],
  });
  const store = createLedgerStore({
    now: new Date('2026-06-05T00:00:00.000Z'),
    earnTransactions: [
      {
        id: 'credit-still-valid',
        remainingAmount: 2,
        expirationDate: new Date('2026-06-20T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'credit-expired-after-reservation',
        remainingAmount: 0,
        expirationDate: new Date('2026-06-01T00:00:00.000Z'),
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ],
    seedReservations: [reservationRecord],
  });

  const result = await refundAICredits(
    {
      reservationId: reservationRecord.id,
      usageId: reservationRecord.usageId,
      userId: reservationRecord.userId,
      reason: 'timeout',
    },
    store.dependencies
  );

  assert.equal(result.success, true);
  assert.equal(store.getBalance(), 2);
  assert.equal(store.getRemainingAmount('credit-expired-after-reservation'), 0);
  assert.equal(store.simulateExpirationJob(), 0);
  assert.equal(store.getBalance(), 2);
});
