import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { findInstrument } from '@river/psp-instruments';
import { checkoutFor } from '@river/psp-runtime';
import { subtreeOf } from '@river/psp-units';
import { stageFunnel } from '@river/psp-views';
import { stageCatalogue } from '@river/psp-facts';
import type { cabinet } from '@/lib/cabinet';
import { count, percent } from '@/lib/format';
import { scoped } from '@/lib/scoped';
import type { Query } from '@/lib/table';
import { HBars } from '../../charts/HBars';
import { RiverFunnel } from '../../charts/RiverFunnel';
import { Metric } from '../../panels/Metric';
import { Panel } from '../../panels/Panel';

/**
 * The pay page designer's overview: how the pages of the reach convert — where payers leave the river,
 * which instruments they choose and how often each completes — and each unit's page at a glance.
 */
export function CheckoutOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  void query;
  const { t } = c;
  const from = new Date(Date.parse(c.now) - 30 * 86_400_000).toISOString();
  const sessions = scoped(c.w, c.visible).sessions.filter((s) => s.openedAt >= from);
  const chosen = sessions.filter((s) => s.instrument);
  const left = sessions.filter((s) => !s.instrument);
  const funnel = stageFunnel(sessions).map((f) => ({ label: pickText(stageCatalogue.find((s) => s.stage === f.stage)!.label, locale), reached: f.reached }));
  const byInstrument = [...new Set(chosen.map((s) => s.instrument!))].map((id) => {
    const all = chosen.filter((s) => s.instrument === id);
    const ok = all.filter((s) => s.outcome === 'succeeded').length;
    return { id, all: all.length, ok };
  }).sort((a, b) => b.all - a.all);
  const units = subtreeOf(c.w.units, c.actor.unitId).filter((u) => u.kind === 'store' || u.kind === 'merchant');
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={t('Pay pages opened, 30 days', 'Відкрито сторінок оплати, 30 днів')} value={count(sessions.length, locale)} />
        <Metric label={t('Paid', 'Сплачено')} value={percent(sessions.length ? Math.round((sessions.filter((s) => s.outcome === 'succeeded').length / sessions.length) * 10_000) : 0, locale)} tone="success" />
        <Metric label={t('Left before choosing', 'Пішли до вибору')} value={percent(sessions.length ? Math.round((left.length / sessions.length) * 10_000) : 0, locale)} tone="warning" note={count(left.length, locale)} />
        <Metric label={t('Pages in your reach', 'Сторінок у ваших межах')} value={String(units.length)} href={c.link('/paypages')} />
      </div>
      <Panel title={t('Where payers leave the river', 'Де платники залишають ріку')}><RiverFunnel stages={funnel} /></Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t('Chosen and completed, by instrument', 'Обрано й завершено, за інструментами')}>
          <HBars rows={byInstrument.map((x) => ({ label: pickText(findInstrument(x.id).label, locale), value: x.all, display: count(x.all, locale), note: percent(x.all ? Math.round((x.ok / x.all) * 10_000) : 0, locale), tone: 'river' }))} />
        </Panel>
        <Panel title={t('The pages', 'Сторінки')} actions={<Link href={c.link('/paypages')} className="annot text-[0.6rem] text-river-700">{t('Design', 'Налаштувати')} →</Link>}>
          <ul className="divide-y divide-graphite/15">
            {units.map((u) => { const cfg = checkoutFor(c.w, u.id, u.currency); return (
              <li key={u.id}><Link href={c.link(`/paypages?unit=${u.id}`)} className="flex items-center gap-3 py-2 hover:bg-paper-deep"><span className="size-4 border border-ink-900" style={{ background: cfg.accent }} /><span className="flex-1 text-[0.88rem] text-ink-900">{pickText(u.name, locale)}</span><span className="annot text-[0.55rem] text-ink-500">{cfg.instruments.length} · {cfg.languages.join(' ')}</span></Link></li>
            ); })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
