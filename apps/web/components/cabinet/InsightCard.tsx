import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue, type Insight } from '@river/psp-agents';
import { decideInsightAction } from '@/lib/actions/cabinet';
import { when } from '@/lib/format';
import { lt } from '@/lib/lt';
import { Icon } from '../ui/Icon';

const subjectPath: Record<string, (id: string) => string | null> = {
  session: (id) => `/sessions/${id}`, payment: (id) => `/payments/${id}`, invoice: (id) => `/invoices/${id}`, order: (id) => `/orders/${id}`,
  unit: (id) => `/units/${id}`, alert: (id) => `/alerts/${id}`, endpoint: (id) => `/webhooks/${id}`, route: () => '/routes', currency: () => '/payouts', fact: () => null,
};

/**
 * One insight of the swarm: who saw what, the evidence (links into the river), how sure, what the other
 * agents added — and the proposal with the person's decision, or the buttons to make it.
 */
export function InsightCard({ insight, locale, link, back, canDecide, personName }: { insight: Insight; locale: Locale; link: (path: string) => string; back: string; canDecide: boolean; personName: (id: string) => string }) {
  const t = lt(locale);
  const agent = agentCatalogue.find((a) => a.id === insight.agent)!;
  const status: Record<Insight['status'], [string, string]> = { open: ['waiting for a person', 'чекає рішення людини'], accepted: ['accepted', 'прийнято'], applied: ['accepted and carried out', 'прийнято й виконано'], declined: ['declined', 'відхилено'], auto_applied: ['done by the unit’s policy', 'виконано за політикою одиниці'], superseded: ['replaced by a newer forecast', 'замінено новішим прогнозом'] };
  return (
    <article className={`border ${insight.status === 'open' ? 'border-sunrise-500/60 bg-paper' : 'border-graphite/20 bg-paper-deep'} p-4`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Icon name={agent.glyph} className="size-4 text-sunrise-600" />
        <span className="annot text-[0.62rem] text-ink-900">{pickText(agent.name, locale)}</span>
        <span className="annot text-[0.6rem] text-ink-500">{when(insight.at, locale)}</span>
        <span className="ml-auto annot text-[0.6rem] text-ink-500">{t('confidence', 'впевненість')} {Math.round(insight.confidence * 100)} %</span>
      </header>
      <h3 className="mt-2 font-semibold text-ink-900">{pickText(insight.title, locale)}</h3>
      <p className="mt-1 text-[0.9rem] text-ink-700">{pickText(insight.finding, locale)}</p>
      {insight.evidence.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {insight.evidence.map((e) => {
            const path = subjectPath[e.kind]?.(e.id) ?? null;
            const label = `${e.id.length > 18 ? `${e.id.slice(0, 16)}…` : e.id} · ${pickText(e.note, locale)}`;
            return <li key={`${e.kind}${e.id}${label}`} className="font-mono text-[0.72rem]">{path ? <Link href={link(path)} className="text-river-700 underline decoration-river-200 underline-offset-2">{label}</Link> : <span className="text-ink-500">{label}</span>}</li>;
          })}
        </ul>
      ) : null}
      {insight.consulted.length > 0 ? (
        <ul className="mt-2 space-y-0.5 border-l border-graphite/30 pl-3">
          {insight.consulted.map((c) => <li key={c.agent} className="text-[0.82rem] text-ink-500"><span className="annot text-[0.6rem] text-ink-700">{pickText(agentCatalogue.find((a) => a.id === c.agent)!.name, locale)}:</span> {pickText(c.note, locale)}</li>)}
        </ul>
      ) : null}
      {insight.proposal ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-graphite/15 pt-3">
          <p className="min-w-[13rem] flex-1 text-[0.88rem] text-ink-900"><span className={`annot mr-2 text-[0.6rem] ${insight.proposal.risk === 'low' ? 'text-teal-600' : 'text-attention-500'}`}>{insight.proposal.risk === 'low' ? t('low risk', 'низький ризик') : t('needs a person', 'потрібна людина')}</span>{pickText(insight.proposal.effect, locale)}</p>
          {insight.status === 'open' && canDecide ? (
            <div className="flex gap-2">
              {(['accept', 'decline'] as const).map((d) => (
                <form key={d} action={decideInsightAction}>
                  <input type="hidden" name="insightId" value={insight.id} /><input type="hidden" name="decision" value={d} /><input type="hidden" name="back" value={back} />
                  <button type="submit" className={d === 'accept' ? 'chamfer px-3 py-1.5 text-[0.8rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]' : 'annot border border-graphite/40 px-2.5 py-1.5 text-ink-700 hover:border-ink-900'}>{d === 'accept' ? t('Accept', 'Прийняти') : t('Decline', 'Відхилити')}</button>
                </form>
              ))}
            </div>
          ) : <span className="annot text-[0.6rem] text-ink-500">{t(status[insight.status][0], status[insight.status][1])}{insight.decidedBy ? ` · ${personName(insight.decidedBy)}` : ''}</span>}
        </div>
      ) : null}
    </article>
  );
}
