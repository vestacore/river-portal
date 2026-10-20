import Link from 'next/link';
import { pickText } from '@river/i18n';
import { findInstrument } from '@river/psp-instruments';
import { checkoutFor, effectiveFor } from '@river/psp-runtime';
import { policyDefinitions, subtreeOf } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { PolicyEditor } from '@/components/cabinet/PolicyEditor';
import { Checkout } from '@/components/checkout/Checkout';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { checkoutProps } from '@/lib/checkoutProps';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

/**
 * The pay pages of the reach. Every unit's page is made by its effective policies — a holding sets the
 * accent and the split's visibility for every shop, a merchant the order of instruments, a store may
 * narrow further — so designing a pay page is setting policies, and the preview is the real component.
 */
export default async function PayPages({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'checkout.read');
  const { t } = c;
  const units = subtreeOf(c.w.units, c.actor.unitId).filter((u) => u.kind === 'merchant' || u.kind === 'store' || u.kind === 'holding');
  const selected = units.find((u) => u.id === query.unit) ?? units.find((u) => u.kind === 'store') ?? units[0];
  if (!selected) return null;
  const config = checkoutFor(c.w, selected.id, selected.currency);
  const sample = [...c.w.views.invoices.values()].filter((i) => subtreeOf(c.w.units, selected.id).some((u) => u.id === i.unitId)).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
  const back = c.link(`/paypages?unit=${selected.id}`);
  const effective = effectiveFor(c.w, selected.id);
  const keys = ['checkout.accent', 'checkout.instrumentOrder', 'checkout.showSplit', 'checkout.collect.email', 'checkout.languages', 'checkout.session.minutes', 'instruments.allowed'];
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
                  <span className="min-w-0"><span className="block truncate text-[0.88rem] text-ink-900">{pickText(u.name, locale)}</span><span className="annot text-[0.52rem] text-ink-500">{cfg.instruments.length} {t('instruments', 'інструментів')}{cfg.showSplit ? ` · ${t('shows the split', 'показує розщеплення')}` : ''}</span></span>
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
            <p className="annot mt-3 text-[0.58rem] text-ink-500">{t('On the page, in this currency and region', 'На сторінці, у цій валюті та регіоні')}: {config.instruments.map((i) => pickText(findInstrument(i).label, locale)).join(' · ')}</p>
          </Panel>
          <Panel title={t('Preview — the real pay page, with nothing sent', 'Перегляд — справжня сторінка оплати, нічого не надсилається')} flush>
            {sample ? (
              <div className="max-h-[52rem] overflow-auto border-t border-graphite/20">
                <Checkout {...checkoutProps(c.w, sample, 'preview', locale, { state: 'choose', sessionId: null, instrument: null, failure: null, paymentId: null, receiptId: null, bridges: 0, waitingFor: null, instructions: {} })} preview />
              </div>
            ) : <p className="p-4 text-ink-500">{t('No invoice of this unit to preview with yet.', 'Ще немає інвойсу цієї одиниці для перегляду.')}</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
