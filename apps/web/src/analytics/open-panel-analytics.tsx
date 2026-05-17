import { clientEnv } from '@repo/env/client';
import { OpenPanelComponent } from '@openpanel/nextjs';

/**
 * OpenPanel Analytics (https://openpanel.dev)
 *
 * https://openpanel.dev
 * https://example.com/docs/analytics#openpanel
 * https://docs.openpanel.dev/docs/sdks/nextjs#options
 */
export default function OpenPanelAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const clientId = clientEnv.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
  if (!clientId) {
    return null;
  }

  return (
    <OpenPanelComponent
      clientId={clientId}
      trackScreenViews={true}
      trackAttributes={true}
      trackOutgoingLinks={true}
    />
  );
}
