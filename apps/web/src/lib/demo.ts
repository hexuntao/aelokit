import { clientEnv } from '@repo/env/client';

/**
 * check if the website is a demo website
 */
export function isDemoWebsite() {
  return clientEnv.NEXT_PUBLIC_DEMO_WEBSITE === true;
}
