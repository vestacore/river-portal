import { formatNumber, type Locale } from '@river/i18n';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * Honest numbers for one payment: the amount as a bar, cut where the commission is taken, and the
 * three figures beside it. The commission is part of the amount, never on top of it.
 */
export function MoneySplit({ amountMinor, feeMinor, netMinor, feeBps, currency, locale, labels }: {
  amountMinor: number; feeMinor: number; netMinor: number; feeBps: number; currency: string; locale: Locale;
  labels: { total: string; net: string; fee: string; rate: string };
}) {
  const share = amountMinor > 0 ? Math.max(2, (feeMinor / amountMinor) * 100) : 0;
  const rows: Array<[string, number, string]> = [[labels.total, amountMinor, 'bg-graphite'], [labels.net, netMinor, 'bg-ink-900'], [labels.fee, feeMinor, 'bg-sunrise-500']];
  return (
    <div>
      <div className="flex h-3" aria-hidden="true">
        <div className="bg-ink-900" style={{ width: `${100 - share}%` }} />
        <div className="bg-sunrise-500" style={{ width: `${share}%` }} />
      </div>
      <dl className="mt-3 border-t border-graphite/60 text-[0.95rem]">
        {rows.map(([label, minor, swatch], i) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-b border-graphite/20 py-2">
            <dt className="flex items-baseline gap-2 text-ink-700">
              {i > 0 ? <span className={`size-2 shrink-0 self-center ${swatch}`} aria-hidden="true" /> : null}
              <span>{label}{i === 2 ? <span className="annot block text-ink-500 sm:ml-2 sm:inline">{labels.rate.replace('{pct}', formatNumber(feeBps / 100, locale))}</span> : null}</span>
            </dt>
            <dd className={`tabular-nums ${i === 0 ? 'font-semibold text-ink-900' : 'text-ink-900'}`}>{payMoney(minor, currency, locale)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
