import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFallbackAssistant } from '@river/assist';
import { readSettings } from '@river/config';
import { readPublicFeed } from '@river/feed';
import { readFlowsByCarrier } from '@river/flows';
import { readNeedsByPerson } from '@river/needs';
import { readCampaignPage, readSiteDoc } from '@river/pages';
import { readReports } from '@river/reports';
import { profileIds, settingText } from '@river/settings';
import { createMemoryStore } from '@river/store';
import { allProjectors } from './allProjectors.ts';
import { demoVariants } from './data/demoVariants.ts';
import { readConfig } from './readConfig.ts';
import { seedDemo } from './seedDemo.ts';
import type { Runtime } from './types/Runtime.ts';

for (const profileId of profileIds) {
  test(`demo seed for ${profileId}: consistent pages, the profile's currency, nothing personal in public documents`, async () => {
    const runtime: Runtime = { config: readConfig({ RIVER_PROFILE: profileId }), store: createMemoryStore(), projectors: allProjectors(), assistant: createFallbackAssistant(), demoTrackingLinks: {} };
    await seedDemo(runtime, profileId);
    await seedDemo(runtime, profileId); // idempotent
    const org = runtime.config.orgId;
    const settings = await readSettings(runtime.store, org, 'small-nationwide');
    assert.equal(settings.profileId, profileId, 'the seed applies the profile');
    const variant = demoVariants[profileId];
    assert.equal(settingText(settings, 'money.reportingCurrency'), variant.currency);
    const site = await readSiteDoc(runtime.store, org);
    assert.equal(site.counters.needsReceived, 6);
    assert.equal(site.counters.needsConfirmed, 1);
    assert.equal(site.counters.deliveries, 1);
    assert.equal(site.campaigns.length, 2);
    assert.equal(site.reports.length, 1);
    assert.ok(site.feed.length >= 2);
    assert.equal(site.gratitude.length, 1);
    assert.ok(site.counters.costsMinor > 0 && Object.keys(site.counters.costBreakdown).length > 0);
    const fuel = await readCampaignPage(runtime.store, org, variant.campaigns.fuel.slug);
    assert.equal(fuel?.currency, variant.currency);
    assert.ok((fuel?.receivedMinor ?? 0) > 0 && (fuel?.spentMinor ?? 0) > 0);
    assert.equal((await readReports(runtime.store, org))[0]?.status, 'published');
    // The guided walk has something to do at every step (ADR-0021).
    const legs = await readFlowsByCarrier(runtime.store, org, 'person_demo_mykola');
    assert.ok(legs.some((f) => f.status === 'in_motion'), 'the carrier persona has a delivery on the way');
    const requests = await readNeedsByPerson(runtime.store, org, 'person_demo_olena');
    assert.deepEqual(requests.map((n) => n.status).sort(), ['confirmed', 'in_delivery'], 'Olena can confirm her second request');
    const feed = await readPublicFeed(runtime.store, org);
    const publicDocs = JSON.stringify([site, fuel, feed]);
    for (const secret of ['Олена', 'Балакл', '+380', 'Vasyl', 'Krasnopillia', '@example', 'Нікополь']) {
      assert.ok(!publicDocs.includes(secret), `${profileId}: public documents leak ${secret}`);
    }
  });
}
