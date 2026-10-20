import type { Metadata } from 'next';
import { pickText, segmentForLocale } from '@river/i18n';
import { demoMerchants } from '@river/psp-runtime';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { shopCheckout } from '@/lib/actions/pay';
import { money } from '@/lib/format';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Demo shops', 'Демо-магазини') };
}

const shops = [
  { unitId: 'ou-kvitka-web', merchantId: 'ou-kvitka-market', icon: 'basket' },
  { unitId: 'ou-baltic-bikes-web', merchantId: 'ou-baltic-bikes', icon: 'wheel' },
  { unitId: 'ou-open-river', merchantId: 'ou-open-river', icon: 'heart' },
] as const;

/**
 * Three demo shops of the hierarchy: a marketplace whose money splits between three sellers, a share for a
 * good cause and the marketplace; a bike shop that takes the money only when the bike ships; a charity
 * with no fee at all. Ordering here does what a shop's server does through the API, then sends you to pay.
 */
export default async function Shop({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string; empty?: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const { error, empty } = await searchParams;
  const w = world();
  const notes: Record<string, string> = {
    'ou-kvitka-market': t('A marketplace: each seller receives its lines less 8 %, 1 % of every payment flows to Open River Aid, the marketplace keeps the rest after the fee. The pay page shows you the split before you pay.', 'Маркетплейс: кожен продавець отримує свої позиції мінус 8 %, 1 % кожного платежу тече до «Відкритої Ріки», маркетплейс залишає решту після комісії. Сторінка оплати показує розщеплення ще до оплати.'),
    'ou-baltic-bikes': t('Prices in euros. The bank only holds the money: the shop captures it when the bike ships — find the hold in the operator’s cabinet of River Pay Europe.', 'Ціни в євро. Банк лише блокує гроші: магазин списує їх, коли велосипед відвантажено, — знайдіть блокування в кабінеті операціоніста River Pay Європа.'),
    'ou-open-river': t('A charity on the non-profit tariff: no fee is taken. Give any amount; the whole of it reaches the foundation.', 'Благодійний фонд на неприбутковому тарифі: комісія не береться. Пожертвуйте будь-яку суму — усе дійде до фонду.'),
  };
  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-08`} title={t('Pay as a customer', 'Сплатіть як клієнт')} lead={t('Choose something, place the order, and pay on the merchant’s own pay page — then follow your payment down the river, bridge by bridge. Use a test card or the stand-in banks; no money moves.', 'Оберіть товар, оформіть замовлення й сплатіть на сторінці оплати мерчанта — а потім простежте свій платіж руслом, міст за мостом. Використовуйте тестову картку або банки-імітатори; гроші не рухаються.')} />
      <Container className="py-14">
        {error ? <p role="alert" className="mb-6 border-l-2 border-attention-500 bg-attention-100 px-3 py-2 text-ink-900">{error}</p> : null}
        {empty ? <p role="alert" className="mb-6 border-l-2 border-sunrise-500 bg-sunrise-100 px-3 py-2 text-ink-900">{t('Choose at least one item.', 'Оберіть хоча б одну позицію.')}</p> : null}
        <div className="grid gap-8 lg:grid-cols-3">
          {shops.map((shop) => {
            const plan = demoMerchants.find((m) => m.merchantId === shop.merchantId)!;
            const merchant = w.units.find((u) => u.id === shop.merchantId)!;
            const products = shop.merchantId === 'ou-open-river' ? [] : plan.products.slice(0, shop.merchantId === 'ou-kvitka-market' ? 8 : 4);
            return (
              <section key={shop.unitId} id={shop.unitId} className="sketch flex flex-col bg-paper p-6">
                <div className="flex items-center gap-3"><Icon name={shop.icon} className="size-7 text-river-700" /><h2 className="text-xl font-semibold text-ink-900">{pickText(merchant.name, locale)}</h2></div>
                <p className="mt-3 text-[0.92rem] text-ink-700">{notes[shop.merchantId]}</p>
                <form action={shopCheckout} className="mt-5 flex flex-1 flex-col">
                  <input type="hidden" name="unitId" value={shop.unitId} />
                  <input type="hidden" name="locale" value={segmentForLocale(locale)} />
                  {products.length > 0 ? (
                    <ul className="divide-y divide-graphite/15 border-y border-graphite/15">
                      {products.map((p, i) => {
                        const unitMinor = Math.round((p.minMinor + p.maxMinor) / 2 / 1_000) * 1_000;
                        const seller = p.sellerUnitId ? pickText(w.units.find((u) => u.id === p.sellerUnitId)?.name, locale) : null;
                        return (
                          <li key={p.sku} className="flex items-center gap-3 py-2.5">
                            <span className="min-w-0 flex-1"><span className="block text-[0.92rem] text-ink-900">{pickText(p.title, locale)}</span><span className="annot block text-[0.58rem] text-ink-500">{seller ?? pickText(merchant.name, locale)} · {money(unitMinor, merchant.currency, locale)}</span></span>
                            <input type="number" min={0} max={9} defaultValue={i < 2 ? 1 : 0} name={`qty:|${p.sku}|${unitMinor}|${p.sellerUnitId ?? ''}|${p.title['en-GB']}|${p.title.uk}`} aria-label={pickText(p.title, locale)} className="w-14 border border-graphite/30 bg-paper px-2 py-1 text-right font-mono text-sm" />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <label className="block text-[0.9rem] text-ink-700">{t('Your gift, UAH', 'Ваша пожертва, грн')}<input name="donation" defaultValue="500" inputMode="decimal" className="mt-1 block w-40 border border-graphite/30 bg-paper px-2 py-1.5 font-mono" /></label>
                  )}
                  <button type="submit" className="chamfer mt-auto inline-flex items-center justify-center gap-2 self-start px-5 py-3 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]" style={{ marginTop: '1.5rem' }}>
                    <Icon name="card" className="size-4" />{shop.merchantId === 'ou-open-river' ? t('Give', 'Пожертвувати') : t('Order and pay', 'Замовити й сплатити')}
                  </button>
                </form>
              </section>
            );
          })}
        </div>
      </Container>
    </>
  );
}
