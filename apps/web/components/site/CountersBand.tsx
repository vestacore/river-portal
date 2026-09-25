import { formatMoney, formatNumber, type Locale } from '@river/i18n';
import type { Counters } from '@river/pages';
import type { Dictionary } from '@/lib/dictionary/types';
import { Container } from '../ui/Container';

/** Live counters as measurements on a bevelled plate: value over a dimension line, label in technical lettering. */
export function CountersBand({ counters, locale, dict }: { counters: Counters; locale: Locale; dict: Dictionary }) {
  const t = dict.home.counters;
  const items = [
    { value: formatNumber(counters.needsReceived, locale), label: t.needsReceived },
    { value: formatNumber(counters.households, locale), label: t.households },
    { value: formatNumber(counters.deliveries, locale), label: t.deliveries },
    { value: formatNumber(counters.giftsPledged, locale), label: t.giftsPledged },
    { value: formatMoney(counters.moneyReceivedGbpMinor, 'GBP', locale), label: t.moneyReceived },
    { value: formatMoney(counters.costsGbpMinor, 'GBP', locale), label: t.costs },
  ];
  return (
    <section className="pt-16">
      <Container>
        <div className="chamfer px-6 py-10 [--cut:40px] [--fill:var(--color-paper-deep)] sm:px-12 sm:py-12">
        <h2 className="annot mb-9 flex items-center gap-3 text-ink-500"><span className="h-px w-12 bg-graphite/40" aria-hidden="true" />{dict.home.countersTitle}</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item, i) => (
            <div key={item.label} className="flex animate-rise flex-col" style={{ animationDelay: `${i * 70}ms` }}>
              <dd className="order-1 text-center font-display text-3xl font-semibold tabular-nums tracking-tight text-ink-900 sm:text-[2.1rem]">{item.value}</dd>
              <div className="dim order-2 mt-2" aria-hidden="true" />
              <dt className="annot order-3 mt-3 text-center text-ink-500">{item.label}</dt>
            </div>
          ))}
        </dl>
        </div>
      </Container>
    </section>
  );
}
