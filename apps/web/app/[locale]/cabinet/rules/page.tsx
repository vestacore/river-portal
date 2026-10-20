import Link from 'next/link';
import { pickText } from '@river/i18n';
import { acquirers } from '@river/psp-instruments';
import { conditionFieldLabels, type RiskRule } from '@river/psp-risk';
import { ancestorsOf, subtreeOf } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { Icon } from '@/components/ui/Icon';
import { saveRuleAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

const ops: Record<string, string> = { gt: '>', ge: '≥', lt: '<', le: '≤', eq: '=', ne: '≠', in: '∈', not_in: '∉' };

/**
 * The rules units set on the attempts below them — the earlier portal's "Rules and Limits", in the same
 * grammar of a field, an operation and a value. Rules accumulate down the tree, by priority; an enforced
 * rule cannot be switched off below. A rule can only make screening stricter, route, or notify.
 */
export default async function Rules({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'rules.write');
  const { t } = c;
  const reach = subtreeOf(c.w.units, c.actor.unitId);
  const ancestors = new Set(ancestorsOf(c.w.units, c.actor.unitId).map((u) => u.id));
  const above = c.w.rules.filter((r) => ancestors.has(r.unitId) && !c.visible.has(r.unitId));
  const rules = [...c.w.rules.filter((r) => c.visible.has(r.unitId)), ...above].sort((a, b) => a.priority - b.priority);
  const back = c.link('/rules');
  const actionTone: Record<RiskRule['action'], 'danger' | 'warning' | 'info' | 'neutral'> = { block: 'danger', review: 'warning', route: 'info', notify: 'neutral' };
  const actionWord: Record<RiskRule['action'], [string, string]> = { block: ['block', 'блокувати'], review: ['hold for review', 'на перевірку'], route: ['route', 'маршрут'], notify: ['notify', 'сповістити'] };
  const cond = (r: RiskRule) => r.conditions.map((x) => `${pickText(conditionFieldLabels[x.field], locale)} ${ops[x.op]} ${Array.isArray(x.value) ? x.value.join(', ') : typeof x.value === 'number' && (x.field === 'amount' || x.field === 'amount_24h') ? money(x.value, c.w.units.find((u) => u.id === r.unitId)?.currency ?? 'UAH', locale) : x.value}`).join(r.compose === 'and' ? t(' and ', ' і ') : t(' or ', ' або '));
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  return (
    <>
      <CabinetHead kicker={t('Financial monitoring and routing', 'Фінмоніторинг і маршрутизація')} title={t('Rules', 'Правила')} lead={t('Every attempt of a unit meets its own rules and the rules of every unit above it, lowest priority first. A rule never lets through what the score held.', 'Кожна спроба одиниці проходить її власні правила і правила всіх одиниць вище, від меншого пріоритету. Правило ніколи не пропускає те, що затримав бал ризику.')} />
      <Flash query={query} locale={locale} />
      <Panel flush>
        <ul className="divide-y divide-graphite/15">
          {rules.map((r) => (
            <li key={`${r.id}${r.unitId}`} className="grid gap-x-5 gap-y-2 px-4 py-3 lg:grid-cols-[3rem_minmax(0,1.3fr)_minmax(0,1fr)_auto]">
              <span className="font-mono text-lg text-ink-500">{r.priority}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2"><span className={`font-semibold ${r.enabled ? 'text-ink-900' : 'text-ink-300 line-through'}`}>{pickText(r.name, locale)}</span>{r.enforced ? <span className="annot inline-flex items-center gap-1 bg-sunrise-500 px-1.5 py-0.5 text-[0.55rem] text-ink-900"><Icon name="lock" className="size-3" />{t('enforced', 'закріплено')}</span> : null}</p>
                <p className="mt-0.5 text-[0.85rem] text-ink-700">{t('If', 'Якщо')} {cond(r) || t('always', 'завжди')}</p>
                <p className="annot mt-1 text-[0.55rem] text-ink-500">{t('set on', 'задано на')} <Link href={c.link(`/units/${r.unitId}`)} className="hover:text-ink-900">{c.unitName(r.unitId)}</Link> · {t('applies to its whole subtree', 'діє на все піддерево')}</p>
              </div>
              <div className="flex items-start gap-2"><Status label={t(actionWord[r.action][0], actionWord[r.action][1])} tone={actionTone[r.action]} />{r.target ? <span className="font-mono text-[0.75rem] text-ink-500">→ {r.target}</span> : null}</div>
              {c.may('rules.write', r.unitId) ? (
                <form action={saveRuleAction}>
                  {Object.entries({ ruleId: r.id, unitId: r.unitId, nameEn: r.name['en-GB'], nameUk: r.name.uk, priority: String(r.priority), action: r.action, target: r.target ?? '', compose: r.compose, enforced: r.enforced ? '1' : '0', enabled: r.enabled ? '0' : '1', back }).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
                  <button type="submit" className="annot border border-graphite/40 px-2.5 py-1.5 text-[0.58rem] text-ink-700 hover:border-ink-900">{r.enabled ? t('Switch off', 'Вимкнути') : t('Switch on', 'Увімкнути')}</button>
                </form>
              ) : <span className="annot text-[0.55rem] text-ink-300">{t('set above', 'задано вище')}</span>}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t('Add a rule', 'Додати правило')} className="mt-6">
        <form action={saveRuleAction} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input type="hidden" name="back" value={back} />
          <label className="text-[0.8rem] text-ink-700 md:col-span-1">{t('On unit', 'На одиниці')}<select name="unitId" className={`mt-1 block w-full ${field}`}>{reach.filter((u) => u.kind !== 'seller').map((u) => <option key={u.id} value={u.id}>{pickText(u.name, locale)}</option>)}</select></label>
          <label className="text-[0.8rem] text-ink-700 md:col-span-1">{t('Name, English', 'Назва англійською')}<input name="nameEn" required className={`mt-1 block w-full ${field}`} /></label>
          <label className="text-[0.8rem] text-ink-700 md:col-span-1">{t('Name, Ukrainian', 'Назва українською')}<input name="nameUk" required className={`mt-1 block w-full ${field}`} /></label>
          <label className="text-[0.8rem] text-ink-700">{t('Priority', 'Пріоритет')}<input name="priority" type="number" defaultValue={50} className={`mt-1 block w-full font-mono ${field}`} /></label>
          <label className="text-[0.8rem] text-ink-700">{t('Then', 'Тоді')}<select name="action" className={`mt-1 block w-full ${field}`}>{(['review', 'block', 'route', 'notify'] as const).map((a) => <option key={a} value={a}>{t(actionWord[a][0], actionWord[a][1])}</option>)}</select></label>
          <label className="text-[0.8rem] text-ink-700">{t('Route to', 'Маршрут до')}<select name="target" className={`mt-1 block w-full ${field}`}><option value="">—</option>{acquirers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className="text-[0.8rem] text-ink-700">{t('If', 'Якщо')}<select name="field" className={`mt-1 block w-full ${field}`}>{Object.entries(conditionFieldLabels).map(([k, v]) => <option key={k} value={k}>{pickText(v, locale)}</option>)}</select></label>
          <label className="text-[0.8rem] text-ink-700">{t('Is', 'Є')}<select name="op" className={`mt-1 block w-full ${field}`}>{Object.entries(ops).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="text-[0.8rem] text-ink-700 md:col-span-2">{t('Value (amounts in whole units; lists comma-separated)', 'Значення (суми в цілих одиницях; списки через кому)')}<input name="cvalue" required className={`mt-1 block w-full font-mono ${field}`} /></label>
          <label className="flex items-end gap-2 pb-2 text-[0.8rem] text-ink-700"><input type="checkbox" name="enforced" value="1" />{t('Enforce below', 'Закріпити донизу')}</label>
          <div className="flex items-end"><button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{t('Add the rule', 'Додати правило')}</button></div>
        </form>
      </Panel>
    </>
  );
}
