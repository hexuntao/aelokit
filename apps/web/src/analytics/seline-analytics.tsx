'use client';

import { clientEnv } from '@repo/env/client';
import Script from 'next/script';

/**
 * Seline Analytics
 *
 * https://seline.com
 * https://example.com/docs/analytics#seline
 * https://seline.com/docs/install-seline
 * https://seline.com/docs/stripe
 */
export function SelineAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const token = clientEnv.NEXT_PUBLIC_SELINE_TOKEN;
  if (!token) {
    return null;
  }

  return (
    <Script async src="https://cdn.seline.com/seline.js" data-token={token} />
  );
}
