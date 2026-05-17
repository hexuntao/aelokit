'use client';

import { clientEnv } from '@repo/env/client';
import Script from 'next/script';

/**
 * DataFast Analytics
 *
 * https://datafa.st
 * https://example.com/docs/analytics#datafast
 */
export default function DataFastAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const domain = clientEnv.NEXT_PUBLIC_DATAFAST_DOMAIN;
  if (!domain) {
    return null;
  }

  const websiteId = clientEnv.NEXT_PUBLIC_DATAFAST_WEBSITE_ID;
  if (!websiteId) {
    return null;
  }

  return (
    <>
      <Script
        defer
        data-website-id={websiteId}
        data-domain={domain}
        src="https://datafa.st/js/script.js"
      />
    </>
  );
}
