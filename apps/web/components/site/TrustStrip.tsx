import { formatDate, intlTag, pickText, type Locale } from '@river/i18n';
import type { Counters } from '@river/pages';
import { settingList, settingLocalised, settingNumber, type SettingsSnapshot } from '@river/settings';
import type { Dictionary } from '@/lib/dictionary/types';
import { Container } from '../ui/Container';

/** Live, verifiable signals of trust, chosen and ordered in settings (home.trust). */
export function TrustStrip({ counters, settings, locale, dict }: { counters: Counters; settings: SettingsSnapshot; locale: Locale; dict: Dictionary }) {
  const items: string[] = [];
  for (const item of settingList(settings, 'home.trust')) {
    if (item === 'since') items.push(dict.trust.since.replace('{year}', String(settingNumber(settings, 'org.foundedYear'))));
    if (item === 'registration') { const r = pickText(settingLocalised(settings, 'org.registration'), locale); if (r) items.push(r); }
    if (item === 'costShare' && counters.moneyReceivedMinor > 0) {
      const pct = new Intl.NumberFormat(intlTag(locale), { style: 'percent', maximumFractionDigits: 0 }).format(counters.costsMinor / counters.moneyReceivedMinor);
      items.push(dict.trust.costShare.replace('{pct}', pct));
    }
    if (item === 'lastDelivery' && counters.lastConfirmedAt) items.push(dict.trust.lastDelivery.replace('{date}', formatDate(counters.lastConfirmedAt, locale)));
  }
  if (items.length === 0) return null;
  return (
    <section className="border-b border-graphite/15 bg-paper-deep/70">
      <Container>
        <ul className="annot flex flex-wrap gap-x-8 gap-y-2 py-4 text-ink-700">
          {items.map((text) => <li key={text} className="flex items-center gap-2"><span className="size-1.5 rotate-45 bg-teal-500" aria-hidden="true" />{text}</li>)}
        </ul>
      </Container>
    </section>
  );
}
