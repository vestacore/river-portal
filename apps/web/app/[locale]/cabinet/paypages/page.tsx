import Link from 'next/link';
import { pickText } from '@river/i18n';
import { findInstrument } from '@river/psp-instruments';
import type { InvoiceView } from '@river/psp-invoice';
import { bonusBalanceOf, checkoutFor, effectiveFor } from '@river/psp-runtime';
import { policyDefinitions, policyValue, subtreeOf } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { PolicyEditor } from '@/components/cabinet/PolicyEditor';
import { Checkout } from '@/components/checkout/Checkout';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { checkoutProps } from '@/lib/checkoutProps';
import { cabinet } from '@/lib/cabinet';
import { money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

/**
 * The pay pages of the reach. Every unit's page is made by its effective policies — a holding sets the
 * accent and the split's visibility for every shop, a merchant the order of instruments, a store may
 * narrow further — so designing a pay page is setting policies, and the preview is the real component.
 * Where the stand is connected with a bonus system, the page may offer bonus points for part of the order:
 * the preview then takes an open invoice whose payer has points, so the block shows as payers see it. The
 * retail group's stores take card payments at their own terminals and have no pay page.
 */
export default async function PayPages({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'checkout.read');
  const { t } = c;
  // On the retail stand the stores' tills are the banks' terminals: only units that trade online have a pay page.
  const online = (id: string) => subtreeOf(c.w.units, id).some((u) => u.kind === 'store' && u.channel !== 'pos');
  const units = subtreeOf(c.w.units, c.actor.unitId).filter((u) => (u.kind === 'merchant' || u.kind === 'store' || u.kind === 'holding') && (c.stand !== 'retail' || online(u.id)));
  const selected = units.find((u) => u.id === query.unit) ?? units.find((u) => u.kind === 'store') ?? units[0];
  if (!selected) return null;
  const config = checkoutFor(c.w, selected.id, selected.currency);
  const loyaltyHere = c.w.providers.includes('bonus-system');
  const inSubtree = new Set(subtreeOf(c.w.units, selected.id).map((u) => u.id));
  const candidates = [...c.w.views.invoices.values()].filter((i) => inSubtree.has(i.unitId)).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const dueOf = (i: InvoiceView) => (i.voided ? 0 : Math.max(0, i.amountMinor - i.paidMinor));
  const payerOf = (i: InvoiceView) => c.w.views.orders.get(i.orderId)?.payerRef ?? '';
  // Where a bonus system is connected, the preview prefers an open invoice of a page with bonus points on
  // whose payer has points, so the block shows as such a payer sees it — one not yet part-paid nor past its
  // due date if there is one — else any open invoice.
  const withPoints = (i: InvoiceView) => dueOf(i) >= 200 && checkoutFor(c.w, i.unitId, i.currency).loyalty && bonusBalanceOf(c.w, payerOf(i)) >= 100;
  const fresh = (i: InvoiceView) => i.paidMinor === 0 && i.dueAt >= c.now;
  const recent = candidates.slice(0, 200);
  const sample = (loyaltyHere ? recent.find((i) => fresh(i) && withPoints(i)) ?? recent.find(withPoints) ?? candidates.find((i) => dueOf(i) > 0) : undefined) ?? candidates[0];
  const back = c.link(`/paypages?unit=${selected.id}`);
  const effective = effectiveFor(c.w, selected.id);
  const keys = ['checkout.accent', 'checkout.instrumentOrder', ...(loyaltyHere ? ['checkout.loyalty'] : []), 'checkout.showSplit', 'checkout.collect.email', 'checkout.languages', 'checkout.session.minutes', 'instruments.allowed'];
  const props = sample ? checkoutProps(c.w, sample, 'preview', locale, { state: 'choose', sessionId: null, instrument: null, failure: null, paymentId: null, receiptId: null, bridges: 0, waitingFor: null, instructions: {} }) : null;
  // What the preview says about bonus points is said of the page it shows: the sample invoice's unit.
  const shownEffective = sample ? effectiveFor(c.w, sample.unitId) : effective;
  const shownLoyalty = sample ? checkoutFor(c.w, sample.unitId, sample.currency).loyalty : config.loyalty;
  const pointsAllowed = ((policyValue(shownEffective, 'instruments.allowed') as string[] | null) ?? []).includes('bonus_points');
  const balance = sample ? money(bonusBalanceOf(c.w, payerOf(sample)), sample.currency, locale) : '';
  const shownUnit = sample && sample.unitId !== selected.id ? t(`The preview shows an invoice of ${c.unitName(sample.unitId)}; that unit’s own policies make its page. `, `У перегляді — інвойс одиниці «${c.unitName(sample.unitId)}»: її сторінку визначають її власні політики. `) : '';
  const loyaltyNote = !loyaltyHere ? null : shownUnit + (props?.bonus
    ? t(`Bonus points are on: the block above the instruments appears for a payer the bonus system knows — this payer has ${balance} in points. In the preview it cannot be used.`, `Бонусні бали ввімкнено: блок над інструментами з’являється для платника, якого знає бонусна система, — у цього платника балів на ${balance}. У перегляді ним не скористатися.`)
    : shownLoyalty ? t('Bonus points are on, but no open invoice here has a payer with points: the block appears when there is one.', 'Бонусні бали ввімкнено, але жоден відкритий інвойс тут не має платника з балами: блок з’явиться, коли такий буде.')
    : policyValue(shownEffective, 'checkout.loyalty') === true && !pointsAllowed ? t('Bonus points are on, but they are not among the instruments allowed here, so the page shows no bonus block.', 'Бонусні бали ввімкнено, але їх немає серед дозволених тут інструментів, тож сторінка не показує бонусного блоку.')
    : t('Bonus points are off: the page shows no bonus block.', 'Бонусні бали вимкнено: сторінка не показує бонусного блоку.'));
  return (
    <>
      <CabinetHead kicker={t('Pay page', 'Сторінка оплати')} title={t('Pay pages', 'Сторінки оплати')} lead={t('A pay page is a projection of policies. Choose a unit, set its policies, and the preview below is the very page its payers will see.', 'Сторінка оплати — проєкція політик. Оберіть одиницю, задайте її політики — і попередній перегляд нижче буде тією самою сторінкою, яку бачитимуть платники.')} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <Panel title={t('Units', 'Одиниці')} flush>
          <ul className="divide-y divide-graphite/15">
            {units.map((u) => {
              const cfg = checkoutFor(c.w, u.id, u.currency);
              return (
                <li key={u.id}><Link href={c.link(`/paypages?unit=${u.id}`)} className={`flex items-center gap-3 px-3 py-2.5 ${u.id === selected.id ? 'bg-paper-deep' : 'hover:bg-paper-deep'}`}>
                  <span className="size-4 shrink-0 border border-ink-900" style={{ background: cfg.accent }} />
                  <span className="min-w-0"><span className="block truncate text-[0.88rem] text-ink-900">{pickText(u.name, locale)}</span><span className="annot text-[0.52rem] text-ink-500">{cfg.instruments.length} {t('instruments', 'інструментів')}{cfg.showSplit ? ` · ${t('shows the split', 'показує розщеплення')}` : ''}{loyaltyHere && cfg.loyalty ? ` · ${t('bonus points', 'бонусні бали')}` : ''}</span></span>
                </Link></li>
              );
            })}
          </ul>
        </Panel>
        <div className="min-w-0 space-y-6">
          <Panel title={`${pickText(selected.name, locale)} · ${t('the policies that make its page', 'політики, що творять її сторінку')}`}>
            <div className="divide-y divide-graphite/15">
              {keys.map((key) => {
                const d = policyDefinitions.find((x) => x.key === key)!;
                return <PolicyEditor key={key} definition={d} effective={effective.find((e) => e.key === key)!} here={c.w.settings.find((s) => s.unitId === selected.id && s.key === key)} unit={selected} units={c.w.units} locale={locale} back={back} editable={key === 'instruments.allowed' ? c.may('policies.write', selected.id) : c.may('checkout.write', selected.id)} />;
              })}
            </div>
            <p className="annot mt-3 text-[0.58rem] text-ink-500">{t('On the page, in this currency and region', 'На сторінці, у цій валюті та регіоні')}: {config.instruments.map((i) => pickText(findInstrument(i).label, locale)).join(' · ')}{loyaltyHere ? ` · ${config.loyalty ? t('bonus points for part of the order', 'бонусні бали за частину замовлення') : t('no bonus points', 'без бонусних балів')}` : ''}</p>
          </Panel>
          <Panel title={t('Preview — the real pay page, with nothing sent', 'Перегляд — справжня сторінка оплати, нічого не надсилається')} note={loyaltyNote ?? undefined} flush>
            {props ? (
              <div className="max-h-[52rem] overflow-auto border-t border-graphite/20">
                <Checkout {...props} preview />
              </div>
            ) : <p className="p-4 text-ink-500">{t('No invoice of this unit to preview with yet.', 'Ще немає інвойсу цієї одиниці для перегляду.')}</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
