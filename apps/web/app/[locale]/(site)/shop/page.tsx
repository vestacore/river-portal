import type { Metadata } from 'next';
import { pickText, segmentForLocale } from '@river/i18n';
import { demoMerchants, groceryProducts } from '@river/psp-runtime';
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
  const w = world('psp');
  const retail = world('retail');
  const grocery = groceryProducts.filter((p) => ['BRD-RYE', 'MLK-25', 'EGG-10', 'CHS-HARD', 'APL-KG', 'COF-BEAN', 'BCK-1KG', 'TOM-KG'].includes(p.sku));
  const notes: Record<string, string> = {
    'ou-kvitka-market': t('A marketplace: each seller receives its lines less 8 %, 1 % of every payment flows to Open River Aid, the marketplace keeps the rest after the fee. The pay page shows you the split before you pay.', 'Маркетплейс: кожен продавець отримує свої позиції мінус 8 %, 1 % кожного платежу тече до «Відкритої Ріки», маркетплейс залишає решту після комісії. Сторінка оплати показує розщеплення ще до оплати.'),
    'ou-baltic-bikes': t('Prices in euros. The bank only holds the money: the shop captures it when the bike ships — find the hold in the operator’s cabinet of River Pay Europe.', 'Ціни в євро. Банк лише блокує гроші: магазин списує їх, коли велосипед відвантажено, — знайдіть блокування в кабінеті операціоніста River Pay Європа.'),
    'ou-open-river': t('A charity on the non-profit tariff: no fee is taken. Give any amount; the whole of it reaches the foundation.', 'Благодійний фонд на неприбутковому тарифі: комісія не береться. Пожертвуйте будь-яку суму — усе дійде до фонду.'),
  };
  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-08`} title={t('Pay as a customer', 'Сплатіть як клієнт')} lead={t('Choose something, place the order and pay on the merchant’s pay page — then follow the payment session event by event on its tracking page. Use a test card or the stand-in banks; no money moves.', 'Оберіть товар, оформіть замовлення й сплатіть на сторінці оплати мерчанта — а потім простежте платіжну сесію подія за подією на сторінці відстеження. Використовуйте тестову картку або банки-імітатори; гроші не рухаються.')} />
      <Container className="py-14">
        {error ? <p role="alert" className="mb-6 border-l-2 border-attention-500 bg-attention-100 px-3 py-2 text-ink-900">{error}</p> : null}
        {empty ? <p role="alert" className="mb-6 border-l-2 border-sunrise-500 bg-sunrise-100 px-3 py-2 text-ink-900">{t('Choose at least one item.', 'Оберіть хоча б одну позицію.')}</p> : null}
        <section id="rt-web" className="sketch mb-12 grid gap-8 bg-paper p-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3"><Icon name="basket" className="size-7 text-river-700" /><h2 className="text-xl font-semibold text-ink-900">{pickText(retail.units.find((u) => u.id === 'rt-web')?.name, locale)} · {pickText(retail.units.find((u) => u.id === 'rt-group')?.name, locale)}</h2></div>
            <p className="mt-3 text-[0.95rem] text-ink-700">{t('The web shop of the retail group’s stand. The card is authorised for the basket; the order is picked — weighed goods at their weight — and the order system captures the picked total, releasing the rest. You may pay part with bonus points. The payment is routed to the acquirer of your card’s own bank where the group has terms with it: try 4242 4242 4242 4242 (Bank Dnipro) or 5555 5555 5555 4444 (Stepove Bank) and look at the route on the tracking page.', 'Інтернет-магазин стенда роздрібної групи. Картку авторизують на суму кошика; замовлення комплектують — ваговий товар за фактичною вагою — і система замовлень списує суму після комплектації, решту розблоковує. Частину можна сплатити бонусними балами. Платіж маршрутизується до еквайра банку, що випустив вашу картку, якщо група має з ним умови: спробуйте 4242 4242 4242 4242 (Банк Дніпро) або 5555 5555 5555 4444 (Степовий банк) і подивіться маршрут на сторінці відстеження.')}</p>
          </div>
          <form action={shopCheckout} className="flex flex-col">
            <input type="hidden" name="unitId" value="rt-web" />
            <input type="hidden" name="locale" value={segmentForLocale(locale)} />
            <ul className="grid gap-x-6 divide-y divide-graphite/15 border-y border-graphite/15 sm:grid-cols-2 sm:divide-y-0">
              {grocery.map((p, i) => {
                const unitMinor = Math.round((p.minMinor + p.maxMinor) / 2 / 100) * 100;
                return (
                  <li key={p.sku} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1"><span className="block text-[0.92rem] text-ink-900">{pickText(p.title, locale)}</span><span className="annot block text-[0.58rem] text-ink-500">{money(unitMinor, 'UAH', locale)}{p.weighed ? ` · ${t('weighed', 'ваговий')}` : ''}</span></span>
                    <input type="number" min={0} max={9} defaultValue={i < 4 ? 1 : 0} name={`qty:|${p.sku}|${unitMinor}||${p.title['en-GB']}|${p.title.uk}`} aria-label={pickText(p.title, locale)} className="w-14 border border-graphite/30 bg-paper px-2 py-1 text-right font-mono text-sm" />
                  </li>
                );
              })}
            </ul>
            <button type="submit" className="chamfer mt-6 inline-flex items-center justify-center gap-2 self-start px-5 py-3 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]">
              <Icon name="card" className="size-4" />{t('Order and pay', 'Замовити й сплатити')}
            </button>
          </form>
        </section>
        <h2 className="annot mb-4 text-ink-500">{t('Shops of the PSP assembly', 'Магазини PSP-збірки')}</h2>
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
