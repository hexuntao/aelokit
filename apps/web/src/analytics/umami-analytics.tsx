'use client';

import { clientEnv } from '@repo/env/client';
import Script from 'next/script';

/**
 * Umami Analytics
 *
 * https://umami.is
 * https://example.com/docs/analytics#umami
 */
export function UmamiAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const websiteId = clientEnv.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) {
    return null;
  }

  const script = clientEnv.NEXT_PUBLIC_UMAMI_SCRIPT;
  if (!script) {
    return null;
  }

  return (
    <Script
      async
      type="text/javascript"
      data-website-id={websiteId}
      src={script}
    />
  );
}
