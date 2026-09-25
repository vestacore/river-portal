import { cache } from 'react';
import { readSiteDoc, type SiteDoc } from '@river/pages';
import { getRuntime } from '@river/runtime';

/** The site document, read once per request (ADR-0012). */
export const loadSite = cache(async (): Promise<SiteDoc> => {
  const runtime = await getRuntime();
  return readSiteDoc(runtime.store, runtime.config.orgId);
});
