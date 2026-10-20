import Link from 'next/link';
import { pickText } from '@river/i18n';
import { effectiveFor } from '@river/psp-runtime';
import { findPolicyDefinition, policyDefinitions, policyGroupLabels, policyGroups, resolvePolicy, subtreeOf } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { Icon } from '@/components/ui/Icon';
import { cabinet } from '@/lib/cabinet';
import { when } from '@/lib/format';
import { policyText } from '@/lib/policyText';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

const modelled = ['limits.payment.max', 'instruments.allowed', 'risk.review.score', 'capture.mode', 'settlement.schedule', 'split.template', 'checkout.accent', 'agents.autonomy'];

/**
 * Where policies are set across the reach, and what they amount to: a model of the effective policy of
 * every merchant side by side, every setting with who set it, and the settings that take no effect where
 * they stand — looser than allowed above, under an enforced one, or blocked — as a directory's policy
 * modelling report would show.
 */
export default async function Policies({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'policies.write');
  const { t } = c;
  const reach = subtreeOf(c.w.units, c.actor.unitId);
  const settings = c.w.settings.filter((s) => c.visible.has(s.unitId) && (!query.group || findPolicyDefinition(s.key).group === query.group));
  const merchants = reach.filter((u) => u.kind === 'merchant');
  const outcome = (s: (typeof settings)[number]) => resolvePolicy(c.w.units, c.w.settings, s.unitId, findPolicyDefinition(s.key)).chain.find((step) => step.unitId === s.unitId)?.outcome ?? 'applied';
  const idle = settings.filter((s) => !['applied', 'narrowed'].includes(outcome(s)));
  const outcomes: Record<string, [string, string]> = { looser: ['looser than allowed above', 'ширше, ніж дозволено вище'], below_enforced: ['under an enforced policy', 'під закріпленою політикою'], blocked: ['blocked by the unit', 'заблоковано одиницею'] };
  return (
    <>
      <CabinetHead kicker={t('Hierarchy of units', 'Ієрархія одиниць')} title={t('Policies', 'Політики')} lead={t('A policy set on a unit applies to its whole subtree. Open a unit to set one; here is the whole picture.', 'Політика, задана на одиниці, діє на все її піддерево. Щоб задати політику, відкрийте одиницю; тут — уся картина.')} />
      <Panel title={t('Policy model: what is in effect for every merchant', 'Модель політик: що діє для кожного мерчанта')} flush>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80"><th className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{t('Merchant', 'Мерчант')}</th>{modelled.map((k) => <th key={k} className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{pickText(findPolicyDefinition(k).label, locale)}</th>)}</tr></thead>
            <tbody>
              {merchants.map((m) => {
                const eff = effectiveFor(c.w, m.id);
                return (
                  <tr key={m.id} className="border-b border-graphite/15 align-top hover:bg-paper-deep">
                    <td className="px-3 py-2"><Link href={c.link(`/units/${m.id}`)} className="text-ink-900 underline decoration-graphite/30 underline-offset-2">{pickText(m.name, locale)}</Link></td>
                    {modelled.map((k) => {
                      const e = eff.find((x) => x.key === k)!;
                      const d = findPolicyDefinition(k);
                      return <td key={k} className="max-w-[14rem] px-3 py-2">{k === 'checkout.accent' ? <span className="inline-block size-3.5 border border-ink-900 align-middle" style={{ background: String(e.value) }} /> : null} <span className="text-ink-900">{k === 'instruments.allowed' ? `${(e.value as string[]).length}` : policyText(d, e.value, locale, m.currency, c.unitName)}</span>{e.enforcedBy ? <Icon name="lock" className="ml-1 inline size-3 text-sunrise-600" /> : null}<span className="annot block text-[0.5rem] text-ink-500">{e.source ? c.unitName(e.source) : t('default', 'типове')}</span></td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {idle.length > 0 ? (
        <Panel title={t('Settings that take no effect where they stand', 'Налаштування, що не діють там, де задані')} tone="attention" className="mt-6">
          <ul className="divide-y divide-graphite/20 text-[0.88rem]">
            {idle.map((s) => { const d = findPolicyDefinition(s.key); const o = outcomes[outcome(s)] ?? ['', '']; return <li key={`${s.unitId}${s.key}`} className="flex flex-wrap items-center justify-between gap-3 py-2"><span><Link href={c.link(`/units/${s.unitId}?group=${d.group}`)} className="text-ink-900 underline decoration-graphite/30">{c.unitName(s.unitId)}</Link> · {pickText(d.label, locale)} = <span className="font-mono">{policyText(d, s.value, locale, c.w.units.find((u) => u.id === s.unitId)?.currency ?? 'UAH', c.unitName)}</span></span><Status label={t(o[0], o[1])} tone="danger" /></li>; })}
          </ul>
        </Panel>
      ) : null}
      <div className="mt-6"><FilterBar locale={locale} query={query} search={false} groups={[{ param: 'group', label: t('Group', 'Група'), options: policyGroups.map((g) => ({ value: g, label: pickText(policyGroupLabels[g], locale), count: c.w.settings.filter((s) => c.visible.has(s.unitId) && findPolicyDefinition(s.key).group === g).length })) }]} /></div>
      <Panel title={t('Every setting in your reach', 'Усі налаштування у ваших межах')} flush>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Unit', 'Одиниця'), t('Policy', 'Політика'), t('Value', 'Значення'), t('Mode', 'Режим'), t('Set by', 'Задав(ла)'), t('Note', 'Примітка')].map((h) => <th key={h} className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
            <tbody>
              {policyDefinitions.flatMap((d) => settings.filter((s) => s.key === d.key).map((s) => (
                <tr key={`${s.unitId}${s.key}`} className="border-b border-graphite/15 hover:bg-paper-deep">
                  <td className="px-3 py-2"><Link href={c.link(`/units/${s.unitId}?group=${d.group}`)} className="text-ink-900 underline decoration-graphite/30 underline-offset-2">{c.unitName(s.unitId)}</Link></td>
                  <td className="px-3 py-2">{pickText(d.label, locale)}<span className="block font-mono text-[0.65rem] text-ink-500">{d.key}</span></td>
                  <td className="max-w-[18rem] px-3 py-2 text-ink-900">{policyText(d, s.value, locale, c.w.units.find((u) => u.id === s.unitId)?.currency ?? 'UAH', c.unitName)}</td>
                  <td className="px-3 py-2">{s.mode === 'enforced' ? <span className="annot inline-flex items-center gap-1 bg-sunrise-500 px-1.5 py-0.5 text-[0.55rem] text-ink-900"><Icon name="lock" className="size-3" />{t('enforced', 'закріплено')}</span> : <span className="text-ink-500">{t('default', 'звичайний')}</span>}</td>
                  <td className="px-3 py-2 text-ink-700">{c.personName(s.setBy)}<span className="block text-[0.7rem] text-ink-500">{when(s.setAt, locale)}</span></td>
                  <td className="px-3 py-2 text-[0.8rem] text-ink-500">{s.note ?? ''}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
