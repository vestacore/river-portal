import { readGifts } from '@river/gifts';
import { formatDate, formatMoney } from '@river/i18n';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';
import { markGiftReceivedAction } from '../actions';

/** Gifts: pledged, received, allocated to flows. */
export default async function GiftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const runtime = await getRuntime();
  const gifts = await readGifts(runtime.store, runtime.config.orgId);
  return (
    <ul className="grid gap-3">
      {gifts.map((g) => (
        <li key={g.id} className="flex flex-wrap items-center gap-3 border-t border-graphite/60 pt-3">
          <b>{dict.give.kinds[g.kind]}</b>
          {g.amountMinor ? <span className="font-display font-bold text-river-900">{formatMoney(g.amountMinor, g.currency ?? 'GBP', locale)}</span> : null}
          <span className="min-w-0 flex-1 truncate text-sm text-ink-500">{g.description || g.displayName || '—'}</span>
          <Badge tone={g.status === 'pledged' ? 'sunrise' : 'teal'}>{g.status}</Badge>
          <span className="text-sm text-ink-500">{formatDate(g.pledgedAt, locale)}</span>
          {g.status === 'pledged' ? (
            <form action={markGiftReceivedAction}><input type="hidden" name="giftId" value={g.id} /><button className="chamfer px-3 py-1 text-xs font-bold text-white [--cut:5px] [--fill:var(--color-teal-600)]">✓ received</button></form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
