import { PaymentScenes } from '@/payment/types.js';
import { loadWorkspaceEnv } from '@repo/env/load';
import { eq } from 'drizzle-orm';

export default async function fixPayments() {
  loadWorkspaceEnv(import.meta.dirname);
  const [{ getDb }, { payment }] = await Promise.all([
    import('../src/db/index.js'),
    import('../src/db/schema.js'),
  ]);
  const db = await getDb();

  try {
    const payments = await db.select().from(payment);

    for (const record of payments) {
      if (record.scene) {
        continue;
      }
      const isOneTimePayment =
        record.type === 'one_time' && record.status === 'completed';
      if (isOneTimePayment && record.paid) {
        console.log(
          'Updating payment, id:',
          record.id,
          'isOneTimePayment:',
          isOneTimePayment,
          'scene:',
          record.scene
        );
        await db
          .update(payment)
          .set({ scene: PaymentScenes.LIFETIME })
          .where(eq(payment.id, record.id));
      }
    }

    console.log('Fix payments completed');
  } catch (error) {
    console.error('Fix payments error:', error);
  }
}

fixPayments();
