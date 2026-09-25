import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFallbackAssistant } from '@river/assist';
import { readPublicFeed } from '@river/feed';
import { readCampaignPage, readSiteDoc } from '@river/pages';
import { readReports } from '@river/reports';
import { createMemoryStore } from '@river/store';
import { allProjectors } from './allProjectors.ts';
import { readConfig } from './readConfig.ts';
import { seedDemo } from './seedDemo.ts';
import type { Runtime } from './types/Runtime.ts';

test('the demo seed produces consistent public pages and nothing personal in public documents', async () => {
  const runtime: Runtime = { config: readConfig({}), store: createMemoryStore(), projectors: allProjectors(), assistant: createFallbackAssistant(), demoTrackingLinks: {} };
  await seedDemo(runtime);
  await seedDemo(runtime); // idempotent
  const site = await readSiteDoc(runtime.store, 'open-river-aid');
  assert.equal(site.counters.needsReceived, 5);
  assert.equal(site.counters.needsConfirmed, 1);
  assert.equal(site.counters.deliveries, 1);
  assert.equal(site.campaigns.length, 2);
  assert.equal(site.reports.length, 1);
  assert.ok(site.feed.length >= 2);
  assert.equal(site.gratitude.length, 1);
  const fuel = await readCampaignPage(runtime.store, 'open-river-aid', 'fuel-for-the-kharkiv-run');
  assert.equal(fuel?.receivedMinor, 169_500);
  assert.ok((fuel?.spentGbpMinor ?? 0) > 70_000);
  assert.equal((await readReports(runtime.store, 'open-river-aid'))[0]?.status, 'published');
  assert.ok((await readPublicFeed(runtime.store, 'open-river-aid')).length >= 2);

  const publicDocs = JSON.stringify([site, fuel, await readPublicFeed(runtime.store, 'open-river-aid')]);
  for (const secret of ['Олена', 'Балакл', '+380', 'Vasyl', 'Krasnopillia', 'james@', 'Mykola', 'Нікополь']) {
    assert.ok(!publicDocs.includes(secret), `public documents leak ${secret}`);
  }
});
