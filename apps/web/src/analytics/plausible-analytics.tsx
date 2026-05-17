'use client';

import { clientEnv } from '@repo/env/client';
import Script from 'next/script';

/**
 * Plausible Analytics
 *
 * NOTICE:
 * If you do not check `404 error pages` when you set up Plausible Analytics,
 * you do not need to add new script to this component.
 *
 * https://plausible.io
 * https://example.com/docs/analytics#plausible
 */
export function PlausibleAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const domain = clientEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) {
    return null;
  }

  const script = clientEnv.NEXT_PUBLIC_PLAUSIBLE_SCRIPT;
  if (!script) {
    return null;
  }

  return (
    <Script defer type="text/javascript" data-domain={domain} src={script} />
  );
}
