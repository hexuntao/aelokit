import { randomUUID } from 'crypto';
import { getDb } from '@repo/db';
import {
  aiCreditReservation,
  creditTransaction,
  userCredit,
} from '@repo/db/schema';
import { and, asc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { CREDIT_TRANSACTION_TYPE } from './types';

const DEFAULT_RESERVATION_TTL_MS = 10 * 60 * 1000;

export type AICreditBillingErrorCode =
  | 'invalid_request'
  | 'insufficient_credits'
  | 'reservation_not_found'
  | 'reservation_failed'
  | 'reservation_expired'
  | 'already_refunded'
  | 'ledger_mutation_failed';

export interface AICreditBillingError {
  readonly code: AICreditBillingErrorCode;
  readonly message: string;
  readonly retryable: boolean;
}

export type AICreditBillingResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: AICreditBillingError };

export interface AICreditReservationRecord {
  readonly id: string;
  readonly usageId: string;
  readonly userId: string;
  readonly reservationStatus:
    | 'preflight_passed'
    | 'preflight_failed'
    | 'reserved'
    | 'reservation_failed'
    | 'cancelled'
    | 'timeout'
    | 'rate_limited';
  readonly settlementStatus:
    | 'pending'
    | 'settled'
    | 'settlement_failed'
    | 'no_charge'
    | 'cancelled'
    | 'timeout'
    | 'rate_limited';
  readonly refundStatus:
    | 'not_required'
    | 'refunded'
    | 'refund_failed'
    | 'no_charge'
    | 'cancelled';
  readonly reservedCredits: number;
  readonly settledCredits?: number;
  readonly refundedCredits?: number;
  readonly failureReason?: string;
  readonly expiresAt?: Date;
  readonly reservedAt?: Date;
  readonly settledAt?: Date;
  readonly refundedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AICreditPreflightParams {
  readonly usageId: string;
  readonly userId: string;
  readonly requiredCredits: number;
}

export interface AICreditPreflight {
  readonly usageId: string;
  readonly userId: string;
  readonly requiredCredits: number;
  readonly currentCredits: number;
  readonly status: 'preflight_passed';
}

export interface AICreditReservationParams extends AICreditPreflightParams {
  readonly reservationId?: string;
  readonly expiresAt?: Date;
}

export interface AICreditSettlementParams {
  readonly reservationId: string;
  readonly usageId: string;
  readonly userId: string;
  readonly settledCredits: number;
  readonly description?: string;
}

export interface AICreditRefundParams {
  readonly reservationId: string;
  readonly usageId: string;
  readonly userId: string;
  readonly reason: string;
}

export interface AICreditBillingStatusParams {
  readonly reservationId?: string;
  readonly usageId?: string;
}

export interface AICreditBillingDependencies {
  readonly now: () => Date;
  readonly getBalance: (userId: string) => Promise<number>;
  readonly findReservationById: (
    reservationId: string
  ) => Promise<AICreditReservationRecord | null>;
  readonly findReservationByUsageId: (
    usageId: string
  ) => Promise<AICreditReservationRecord | null>;
  readonly createReservation: (
    params: Required<AICreditReservationParams>
  ) => Promise<AICreditBillingResult<AICreditReservationRecord>>;
  readonly settleReservation: (
    params: AICreditSettlementParams
  ) => Promise<AICreditBillingResult<AICreditReservationRecord>>;
  readonly refundReservation: (
    params: AICreditRefundParams
  ) => Promise<AICreditBillingResult<AICreditReservationRecord>>;
}

type DbReservation = typeof aiCreditReservation.$inferSelect;

function billingError(
  code: AICreditBillingErrorCode,
  message: string,
  retryable = false
): AICreditBillingError {
  return { code, message, retryable };
}

function validateCredits(amount: number): AICreditBillingError | null {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return billingError(
      'invalid_request',
      'Credits amount must be a positive integer.'
    );
  }

  return null;
}

function normalizeReservation(
  reservation: DbReservation
): AICreditReservationRecord {
  return {
    id: reservation.id,
    usageId: reservation.usageId,
    userId: reservation.userId,
    reservationStatus:
      reservation.reservationStatus as AICreditReservationRecord['reservationStatus'],
    settlementStatus:
      reservation.settlementStatus as AICreditReservationRecord['settlementStatus'],
    refundStatus:
      reservation.refundStatus as AICreditReservationRecord['refundStatus'],
    reservedCredits: reservation.reservedCredits,
    settledCredits: reservation.settledCredits ?? undefined,
    refundedCredits: reservation.refundedCredits ?? undefined,
    failureReason: reservation.failureReason ?? undefined,
    expiresAt: reservation.expiresAt ?? undefined,
    reservedAt: reservation.reservedAt ?? undefined,
    settledAt: reservation.settledAt ?? undefined,
    refundedAt: reservation.refundedAt ?? undefined,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

async function getCurrentCredits(userId: string): Promise<number> {
  const db = await getDb();
  const [record] = await db
    .select({ currentCredits: userCredit.currentCredits })
    .from(userCredit)
    .where(eq(userCredit.userId, userId))
    .limit(1);

  return record?.currentCredits ?? 0;
}

async function findReservationById(
  reservationId: string
): Promise<AICreditReservationRecord | null> {
  const db = await getDb();
  const [record] = await db
    .select()
    .from(aiCreditReservation)
    .where(eq(aiCreditReservation.id, reservationId))
    .limit(1);

  return record ? normalizeReservation(record) : null;
}

async function findReservationByUsageId(
  usageId: string
): Promise<AICreditReservationRecord | null> {
  const db = await getDb();
  const [record] = await db
    .select()
    .from(aiCreditReservation)
    .where(eq(aiCreditReservation.usageId, usageId))
    .limit(1);

  return record ? normalizeReservation(record) : null;
}

async function createReservationRecord(
  params: Required<AICreditReservationParams>
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  const db = await getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${userCredit} where ${userCredit.userId} = ${params.userId} for update`
    );

    const ledgerError = await consumeReservedAICredits(tx, params, now);
    if (ledgerError) {
      return {
        success: false,
        error: ledgerError,
      };
    }

    const [created] = await tx
      .insert(aiCreditReservation)
      .values({
        id: params.reservationId,
        usageId: params.usageId,
        userId: params.userId,
        reservationStatus: 'reserved',
        settlementStatus: 'pending',
        refundStatus: 'not_required',
        reservedCredits: params.requiredCredits,
        settledCredits: null,
        refundedCredits: null,
        failureReason: null,
        expiresAt: params.expiresAt,
        reservedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      success: true,
      data: normalizeReservation(created),
    };
  });
}

async function consumeReservedAICredits(
  tx: any,
  params: Pick<
    AICreditReservationParams,
    'usageId' | 'userId' | 'requiredCredits'
  >,
  now: Date
): Promise<AICreditBillingError | null> {
  const [creditRecord] = await tx
    .select({
      currentCredits: userCredit.currentCredits,
    })
    .from(userCredit)
    .where(eq(userCredit.userId, params.userId))
    .limit(1);

  if (!creditRecord || creditRecord.currentCredits < params.requiredCredits) {
    return billingError(
      'insufficient_credits',
      'Insufficient credits during AI credits reservation.'
    );
  }

  const earnTransactions = await tx
    .select()
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.userId, params.userId),
        gt(creditTransaction.remainingAmount, 0),
        or(
          isNull(creditTransaction.expirationDate),
          gt(creditTransaction.expirationDate, now)
        )
      )
    )
    .orderBy(
      asc(creditTransaction.expirationDate),
      asc(creditTransaction.createdAt)
    );

  let remainingToDeduct = params.requiredCredits;
  for (const transaction of earnTransactions) {
    if (remainingToDeduct <= 0) break;
    const remainingAmount = transaction.remainingAmount ?? 0;
    const deductFromThis = Math.min(remainingAmount, remainingToDeduct);

    await tx
      .update(creditTransaction)
      .set({
        remainingAmount: remainingAmount - deductFromThis,
        updatedAt: now,
      })
      .where(eq(creditTransaction.id, transaction.id));

    remainingToDeduct -= deductFromThis;
  }

  if (remainingToDeduct > 0) {
    return billingError(
      'ledger_mutation_failed',
      'Credits balance and credit transaction remaining amounts are inconsistent.'
    );
  }

  await tx
    .update(userCredit)
    .set({
      currentCredits: creditRecord.currentCredits - params.requiredCredits,
      updatedAt: now,
    })
    .where(eq(userCredit.userId, params.userId));

  await tx.insert(creditTransaction).values({
    id: randomUUID(),
    userId: params.userId,
    type: CREDIT_TRANSACTION_TYPE.AI_USAGE,
    amount: -params.requiredCredits,
    remainingAmount: null,
    description: `AI usage reservation hold for usage ${params.usageId}`,
    paymentId: params.usageId,
    createdAt: now,
    updatedAt: now,
  });

  return null;
}

async function settleReservationRecord(
  params: AICreditSettlementParams
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  const creditError = validateCredits(params.settledCredits);
  if (creditError) {
    return { success: false, error: creditError };
  }

  const db = await getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${aiCreditReservation} where id = ${params.reservationId} for update`
    );

    const [reservation] = await tx
      .select()
      .from(aiCreditReservation)
      .where(eq(aiCreditReservation.id, params.reservationId))
      .limit(1);

    if (!reservation) {
      return {
        success: false,
        error: billingError('reservation_not_found', 'Reservation not found.'),
      };
    }

    if (
      reservation.userId !== params.userId ||
      reservation.usageId !== params.usageId
    ) {
      return {
        success: false,
        error: billingError(
          'invalid_request',
          'Reservation does not match usage or user.'
        ),
      };
    }

    if (reservation.settlementStatus === 'settled') {
      return {
        success: true,
        data: normalizeReservation(reservation),
      };
    }

    if (reservation.refundStatus === 'refunded') {
      return {
        success: false,
        error: billingError(
          'already_refunded',
          'Cannot settle an already refunded reservation.'
        ),
      };
    }

    if (reservation.expiresAt && reservation.expiresAt < now) {
      const [updated] = await tx
        .update(aiCreditReservation)
        .set({
          reservationStatus: 'cancelled',
          settlementStatus: 'no_charge',
          refundStatus: 'refunded',
          refundedCredits: reservation.reservedCredits,
          failureReason: 'reservation_expired',
          refundedAt: now,
          updatedAt: now,
        })
        .where(eq(aiCreditReservation.id, params.reservationId))
        .returning();

      await tx.insert(creditTransaction).values({
        id: randomUUID(),
        userId: params.userId,
        type: CREDIT_TRANSACTION_TYPE.AI_USAGE_REFUND,
        amount: reservation.reservedCredits,
        remainingAmount: reservation.reservedCredits,
        description: `Released expired AI reservation for usage ${params.usageId}`,
        paymentId: params.usageId,
        createdAt: now,
        updatedAt: now,
      });

      const [creditRecord] = await tx
        .select({
          id: userCredit.id,
          currentCredits: userCredit.currentCredits,
        })
        .from(userCredit)
        .where(eq(userCredit.userId, params.userId))
        .limit(1);

      if (creditRecord) {
        await tx
          .update(userCredit)
          .set({
            currentCredits: creditRecord.currentCredits + reservation.reservedCredits,
            updatedAt: now,
          })
          .where(eq(userCredit.id, creditRecord.id));
      }

      return {
        success: false,
        error: billingError('reservation_expired', 'Reservation expired.'),
      };
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
      const [creditRecord] = await tx
        .select({
          id: userCredit.id,
          currentCredits: userCredit.currentCredits,
        })
        .from(userCredit)
        .where(eq(userCredit.userId, params.userId))
        .limit(1);

      if (creditRecord) {
        await tx
          .update(userCredit)
          .set({
            currentCredits: creditRecord.currentCredits + releasedCredits,
            updatedAt: now,
          })
          .where(eq(userCredit.id, creditRecord.id));
      } else {
        await tx.insert(userCredit).values({
          id: randomUUID(),
          userId: params.userId,
          currentCredits: releasedCredits,
          createdAt: now,
          updatedAt: now,
        });
      }

      await tx.insert(creditTransaction).values({
        id: randomUUID(),
        userId: params.userId,
        type: CREDIT_TRANSACTION_TYPE.AI_USAGE_REFUND,
        amount: releasedCredits,
        remainingAmount: releasedCredits,
        description: `Released unused AI reservation credits for usage ${params.usageId}`,
        paymentId: params.usageId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const [updated] = await tx
      .update(aiCreditReservation)
      .set({
        settlementStatus: 'settled',
        settledCredits,
        refundStatus: releasedCredits > 0 ? 'refunded' : reservation.refundStatus,
        refundedCredits: releasedCredits > 0 ? releasedCredits : reservation.refundedCredits,
        refundedAt: releasedCredits > 0 ? now : reservation.refundedAt,
        failureReason: null,
        settledAt: now,
        updatedAt: now,
      })
      .where(eq(aiCreditReservation.id, params.reservationId))
      .returning();

    return {
      success: true,
      data: normalizeReservation(updated),
    };
  });
}

async function refundReservationRecord(
  params: AICreditRefundParams
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  const db = await getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${aiCreditReservation} where id = ${params.reservationId} for update`
    );

    const [reservation] = await tx
      .select()
      .from(aiCreditReservation)
      .where(eq(aiCreditReservation.id, params.reservationId))
      .limit(1);

    if (!reservation) {
      return {
        success: false,
        error: billingError('reservation_not_found', 'Reservation not found.'),
      };
    }

    if (
      reservation.userId !== params.userId ||
      reservation.usageId !== params.usageId
    ) {
      return {
        success: false,
        error: billingError(
          'invalid_request',
          'Reservation does not match usage or user.'
        ),
      };
    }

    if (reservation.refundStatus === 'refunded') {
      return {
        success: true,
        data: normalizeReservation(reservation),
      };
    }

    if (reservation.settlementStatus !== 'settled') {
      const creditsToRelease = reservation.reservedCredits;
      const [creditRecord] = await tx
        .select({
          id: userCredit.id,
          currentCredits: userCredit.currentCredits,
        })
        .from(userCredit)
        .where(eq(userCredit.userId, params.userId))
        .limit(1);

      if (creditRecord) {
        await tx
          .update(userCredit)
          .set({
            currentCredits: creditRecord.currentCredits + creditsToRelease,
            updatedAt: now,
          })
          .where(eq(userCredit.id, creditRecord.id));
      } else {
        await tx.insert(userCredit).values({
          id: randomUUID(),
          userId: params.userId,
          currentCredits: creditsToRelease,
          createdAt: now,
          updatedAt: now,
        });
      }

      await tx.insert(creditTransaction).values({
        id: randomUUID(),
        userId: params.userId,
        type: CREDIT_TRANSACTION_TYPE.AI_USAGE_REFUND,
        amount: creditsToRelease,
        remainingAmount: creditsToRelease,
        description: `Released AI reservation for usage ${params.usageId}: ${params.reason}`,
        paymentId: params.usageId,
        createdAt: now,
        updatedAt: now,
      });

      const [updated] = await tx
        .update(aiCreditReservation)
        .set({
          reservationStatus: 'cancelled',
          settlementStatus: 'no_charge',
          refundStatus: 'refunded',
          refundedCredits: creditsToRelease,
          failureReason: params.reason,
          refundedAt: now,
          updatedAt: now,
        })
        .where(eq(aiCreditReservation.id, params.reservationId))
        .returning();

      return {
        success: true,
        data: normalizeReservation(updated),
      };
    }

    const creditsToRefund =
      reservation.settledCredits ?? reservation.reservedCredits;
    if (creditsToRefund <= 0) {
      const [updated] = await tx
        .update(aiCreditReservation)
        .set({
          refundStatus: 'no_charge',
          refundedCredits: 0,
          refundedAt: now,
          updatedAt: now,
        })
        .where(eq(aiCreditReservation.id, params.reservationId))
        .returning();

      return {
        success: true,
        data: normalizeReservation(updated),
      };
    }

    const [creditRecord] = await tx
      .select({
        id: userCredit.id,
        currentCredits: userCredit.currentCredits,
      })
      .from(userCredit)
      .where(eq(userCredit.userId, params.userId))
      .limit(1);

    if (creditRecord) {
      await tx
        .update(userCredit)
        .set({
          currentCredits: creditRecord.currentCredits + creditsToRefund,
          updatedAt: now,
        })
        .where(eq(userCredit.id, creditRecord.id));
    } else {
      await tx.insert(userCredit).values({
        id: randomUUID(),
        userId: params.userId,
        currentCredits: creditsToRefund,
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId: params.userId,
      type: CREDIT_TRANSACTION_TYPE.AI_USAGE_REFUND,
      amount: creditsToRefund,
      remainingAmount: creditsToRefund,
      description: `AI usage refund for usage ${params.usageId}: ${params.reason}`,
      paymentId: params.usageId,
      createdAt: now,
      updatedAt: now,
    });

    const [updated] = await tx
      .update(aiCreditReservation)
      .set({
        refundStatus: 'refunded',
        refundedCredits: creditsToRefund,
        failureReason: params.reason,
        refundedAt: now,
        updatedAt: now,
      })
      .where(eq(aiCreditReservation.id, params.reservationId))
      .returning();

    return {
      success: true,
      data: normalizeReservation(updated),
    };
  });
}

function createDatabaseDependencies(): AICreditBillingDependencies {
  return {
    now: () => new Date(),
    getBalance: getCurrentCredits,
    findReservationById,
    findReservationByUsageId,
    createReservation: createReservationRecord,
    settleReservation: settleReservationRecord,
    refundReservation: refundReservationRecord,
  };
}

export async function preflightAICredits(
  params: AICreditPreflightParams,
  dependencies: AICreditBillingDependencies = createDatabaseDependencies()
): Promise<AICreditBillingResult<AICreditPreflight>> {
  const creditError = validateCredits(params.requiredCredits);
  if (creditError) {
    return { success: false, error: creditError };
  }

  const currentCredits = await dependencies.getBalance(params.userId);
  if (currentCredits < params.requiredCredits) {
    return {
      success: false,
      error: billingError(
        'insufficient_credits',
        'Insufficient credits for AI request.'
      ),
    };
  }

  return {
    success: true,
    data: {
      usageId: params.usageId,
      userId: params.userId,
      requiredCredits: params.requiredCredits,
      currentCredits,
      status: 'preflight_passed',
    },
  };
}

export async function reserveAICredits(
  params: AICreditReservationParams,
  dependencies: AICreditBillingDependencies = createDatabaseDependencies()
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  const preflight = await preflightAICredits(params, dependencies);
  if (!preflight.success) {
    return {
      success: false,
      error:
        preflight.error.code === 'insufficient_credits'
          ? billingError(
              'insufficient_credits',
              'Insufficient credits for AI reservation.'
            )
          : preflight.error,
    };
  }

  const existingReservation = await dependencies.findReservationByUsageId(
    params.usageId
  );
  if (existingReservation) {
    return {
      success: true,
      data: existingReservation,
    };
  }

  const now = dependencies.now();
  const reservationId = params.reservationId ?? randomUUID();
  const expiresAt =
    params.expiresAt ?? new Date(now.getTime() + DEFAULT_RESERVATION_TTL_MS);

  try {
    const reservation = await dependencies.createReservation({
      ...params,
      reservationId,
      expiresAt,
    });

    return reservation;
  } catch (error) {
    return {
      success: false,
      error: billingError(
        'reservation_failed',
        error instanceof Error ? error.message : 'Failed to reserve credits.',
        true
      ),
    };
  }
}

export async function settleAICredits(
  params: AICreditSettlementParams,
  dependencies: AICreditBillingDependencies = createDatabaseDependencies()
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  if (!params.reservationId) {
    return {
      success: false,
      error: billingError(
        'invalid_request',
        'AI credits settlement requires a reservation id.'
      ),
    };
  }

  const creditError = validateCredits(params.settledCredits);
  if (creditError) {
    return { success: false, error: creditError };
  }

  return dependencies.settleReservation(params);
}

export async function refundAICredits(
  params: AICreditRefundParams,
  dependencies: AICreditBillingDependencies = createDatabaseDependencies()
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  if (!params.reservationId) {
    return {
      success: false,
      error: billingError(
        'invalid_request',
        'AI credits refund requires a reservation id.'
      ),
    };
  }

  return dependencies.refundReservation(params);
}

export async function getAICreditBillingStatus(
  params: AICreditBillingStatusParams,
  dependencies: AICreditBillingDependencies = createDatabaseDependencies()
): Promise<AICreditBillingResult<AICreditReservationRecord>> {
  if (!params.reservationId && !params.usageId) {
    return {
      success: false,
      error: billingError(
        'invalid_request',
        'reservationId or usageId is required.'
      ),
    };
  }

  const reservation = params.reservationId
    ? await dependencies.findReservationById(params.reservationId)
    : await dependencies.findReservationByUsageId(params.usageId!);

  if (!reservation) {
    return {
      success: false,
      error: billingError('reservation_not_found', 'Reservation not found.'),
    };
  }

  return {
    success: true,
    data: reservation,
  };
}
