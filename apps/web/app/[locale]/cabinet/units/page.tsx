import Link from 'next/link';
import { pickText } from '@river/i18n';
import { contractStatusAt, contractStatusLabels } from '@river/psp-contracts';
import { ancestorsOf, subtreeOf, unitKindLabels, unitKinds } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { BasinDrawing, type BasinMark } from '@/components/river/BasinDrawing';
import { Icon } from '@/components/ui/Icon';
import { createUnitAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { capturedSince, sinceDays, subtreeFlows } from '@/lib/figures';
import { money } from '@/lib/format';
import { groupFlows } from '@/lib/routingFigures';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';
import { treeLayout } from '@/lib/treeLayout';

/**
 * The hierarchy of the profile's reach, as a directory's tree of organisational units: each unit with its
 * kind, status, the policies set on it (and how many it enforces), whether it blocks inheritance, its
 * subtree's flows, its contract — and the basin drawing of the same tree.
 */
export default async function Units({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'flows.read');
  const { t } = c;
  const reach = subtreeOf(c.w.units, c.actor.unitId);
  const base = ancestorsOf(c.w.units, c.actor.unitId).length;
  const from = sinceDays(30);
  const paid = capturedSince(c.w, from, c.visible);
  // In the retail group the stores' card turnover comes from the banks' reports: the platform does not carry those payments.
  const retail = c.stand === 'retail';
  const flows = retail ? groupFlows(c.w, from) : subtreeFlows(c.w, from);
  const flowText = (unitId: string) => {
    if (retail) return flows[unitId] ? money(flows[unitId]!, 'UAH', locale, true) : '—';
    const by = new Map<string, number>();
    for (const p of paid) if (subtreeOf(c.w.units, unitId).some((u) => u.id === p.unitId)) by.set(p.currency, (by.get(p.currency) ?? 0) + p.capturedMinor);
    return [...by.entries()].map(([cur, v]) => money(v, cur, locale, true)).join(' · ') || '—';
  };
  const tree = treeLayout(c.w.units, c.actor.unitId, (u) => (retail ? u.kind !== 'store' || u.channel !== 'pos' : u.kind !== 'store' && u.kind !== 'seller'), 1400, 92);
  const height = 40 + Math.max(0, ...tree.map((n) => n.depth)) * 92 + 84;
  const short = (s: string) => (s.length > 18 ? `${s.slice(0, 17)}…` : s);
  const marks: Record<string, BasinMark> = Object.fromEntries(reach.map((u) => [u.id, { unitId: u.id, flow: flows[u.id] ?? 0, enforced: c.w.settings.filter((s) => s.unitId === u.id && s.mode === 'enforced').length, set: c.w.settings.filter((s) => s.unitId === u.id).length, blocked: u.blockInheritance, onboarding: u.status === 'onboarding', label: short(pickText(u.name, locale).replace(/^River Pay /, '')), sub: flowText(u.id) }]));
  const back = c.link('/units');
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  return (
    <>
      <CabinetHead kicker={t('Hierarchy of units', 'Ієрархія одиниць')} title={t('The tree of units', 'Дерево одиниць')}
        lead={t('Like organisational units in a directory: a unit sees and steers its whole subtree. Policies set on a unit apply to every unit below it — overridden, narrowed, enforced, or stopped by a unit that blocks inheritance.', 'Як організаційні одиниці в каталозі: одиниця бачить і спрямовує все своє піддерево. Політики одиниці діють на всі нижчі — їх перевизначають, звужують, закріплюють або зупиняють блокуванням успадкування.')} />
      <Flash query={query} locale={locale} />
      <Panel title={t('The tree', 'Дерево')} note={retail ? t('Channel width: the money of the subtree in 30 days — online payments captured, and the stores’ card turnover from the banks’ reports; stores are left out of the drawing. A lock marks enforced policies.', 'Ширина русла: гроші піддерева за 30 днів — списані онлайн-платежі та картковий оборот магазинів зі звітів банків; магазини на кресленні не показано. Замок — закріплені політики.') : t('Channel width: money captured in the subtree in 30 days. A lock marks enforced policies; a red gate, a unit that blocks inheritance.', 'Ширина русла: гроші, списані в піддереві за 30 днів. Замок — закріплені політики; червоний затвор — блокування успадкування.')} flush>
        <div className="overflow-x-auto p-3"><div className="min-w-[1100px]"><BasinDrawing nodes={tree} marks={marks} width={1400} height={height} legend={{ flows: t('money of the subtree, 30 days', 'гроші піддерева, 30 днів'), policies: t('policies apply below', 'політики діють донизу'), enforced: t('enforces', 'закріплює'), blocked: t('blocks inheritance', 'блокує успадкування'), onboarding: t('onboarding', 'онбординг') }} /></div></div>
      </Panel>
      <Panel title={t('Every unit of your reach', 'Усі одиниці у ваших межах')} className="mt-6" flush>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.88rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Unit', 'Одиниця'), t('Kind', 'Вид'), t('Status', 'Статус'), t('Policies', 'Політики'), t('Inheritance', 'Успадкування'), retail ? t('Money, 30 days', 'Гроші, 30 днів') : t('Captured, 30 days', 'Списано, 30 днів'), t('Contract', 'Договір')].map((h) => <th key={h} className="annot whitespace-nowrap px-3 py-2.5 text-[0.6rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
            <tbody>
              {reach.map((u) => {
                const depth = ancestorsOf(c.w.units, u.id).length - base;
                const set = c.w.settings.filter((s) => s.unitId === u.id);
                const contract = c.w.contracts.find((x) => x.unitId === u.id && x.kind !== 'data_processing' && x.kind !== 'marketplace_addendum');
                return (
                  <tr key={u.id} className="border-b border-graphite/15 hover:bg-paper-deep">
                    <td className="px-3 py-2"><span style={{ paddingLeft: `${depth * 1.25}rem` }} className="inline-flex items-center gap-2">{depth > 0 ? <span className="text-ink-300">└</span> : null}<Link href={c.link(`/units/${u.id}`)} className="text-ink-900 underline decoration-graphite/30 underline-offset-2 hover:decoration-sunrise-500">{pickText(u.name, locale)}</Link><span className="font-mono text-[0.68rem] text-ink-500">{u.code}</span></span></td>
                    <td className="px-3 py-2 text-ink-700">{pickText(unitKindLabels[u.kind], locale)}</td>
                    <td className="px-3 py-2"><Status label={u.status === 'active' ? t('active', 'діє') : u.status === 'onboarding' ? t('onboarding', 'онбординг') : t('suspended', 'призупинено')} tone={u.status === 'active' ? 'success' : u.status === 'onboarding' ? 'warning' : 'danger'} /></td>
                    <td className="px-3 py-2 font-mono text-[0.8rem]">{set.length ? <>{set.length}{set.some((s) => s.mode === 'enforced') ? <span className="ml-1.5 inline-flex items-center gap-0.5 text-sunrise-600"><Icon name="lock" className="size-3" />{set.filter((s) => s.mode === 'enforced').length}</span> : null}</> : <span className="text-ink-300">—</span>}</td>
                    <td className="px-3 py-2">{u.blockInheritance ? <Status label={t('blocked', 'заблоковано')} tone="danger" /> : <span className="text-ink-300">—</span>}</td>
                    <td className="px-3 py-2 tabular-nums">{flowText(u.id)}</td>
                    <td className="px-3 py-2">{contract ? <Status label={pickText(contractStatusLabels[contractStatusAt(contract, c.now)], locale)} tone={contractStatusAt(contract, c.now) === 'active' ? 'success' : 'warning'} /> : <span className="text-ink-300">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {c.may('units.write') ? (
        <Panel title={t('Add a unit', 'Додати одиницю')} note={t('A new merchant starts in onboarding: it trades once its checks pass and its contract is active.', 'Новий мерчант починає з онбордингу: торгує, щойно пройде перевірки та набуде чинності договір.')} className="mt-6">
          <form action={createUnitAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="back" value={back} />
            <label className="text-[0.8rem] text-ink-700">{t('Under', 'Під')}<select name="parentId" className={`mt-1 block ${field}`}>{reach.filter((u) => u.kind !== 'store' && u.kind !== 'seller').map((u) => <option key={u.id} value={u.id}>{pickText(u.name, locale)}</option>)}</select></label>
            <label className="text-[0.8rem] text-ink-700">{t('Kind', 'Вид')}<select name="kind" defaultValue="merchant" className={`mt-1 block ${field}`}>{unitKinds.filter((k) => k !== 'platform').map((k) => <option key={k} value={k}>{pickText(unitKindLabels[k], locale)}</option>)}</select></label>
            <label className="text-[0.8rem] text-ink-700">{t('Name, English', 'Назва англійською')}<input name="nameEn" required className={`mt-1 block ${field}`} /></label>
            <label className="text-[0.8rem] text-ink-700">{t('Name, Ukrainian', 'Назва українською')}<input name="nameUk" required className={`mt-1 block ${field}`} /></label>
            <label className="text-[0.8rem] text-ink-700">{t('Code', 'Код')}<input name="code" className={`mt-1 block w-28 font-mono ${field}`} /></label>
            <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{t('Add', 'Додати')}</button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}
