import { pickText, type Locale } from '@river/i18n';
import { effectiveFor } from '@river/psp-runtime';
import type { EffectivePolicy } from '@river/psp-units';
import type { cabinet } from '@/lib/cabinet';
import { percent, when } from '@/lib/format';
import { roleText } from '@/lib/roleText';
import { settingNote } from '@/lib/routing/settingNote';
import { strategyText } from '@/lib/routing/strategyText';
import { thresholdFloor } from '@/lib/routing/thresholdFloor';
import { Icon } from '../../ui/Icon';
import { RoutingPolicyForm } from './RoutingPolicyForm';

const strategies = ['approval_first', 'least_cost', 'on_us_first'] as const;

/**
 * The routing policy in force at the profile's unit — the strategy and the approval threshold, who set
 * each and when — and, for a person with the right to change routing there, a small form for each.
 */
export function PolicyInForce({ c, locale, back, priced }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; back: string; priced: boolean }) {
  const { t } = c;
  const unitId = c.actor.unitId;
  const effective = effectiveFor(c.w, unitId);
  const strategyPolicy = effective.find((e) => e.key === 'routing.strategy');
  const thresholdPolicy = effective.find((e) => e.key === 'routing.minApproval.bps');
  const strategy = String(strategyPolicy?.value ?? 'approval_first');
  const threshold = Number(thresholdPolicy?.value ?? 0);
  const canWrite = c.may('routing.write', unitId);
  const floor = thresholdFloor(c.w, unitId);
  const pct = (bps: number) => percent(bps, locale, bps % 100 === 0 ? 0 : 1);
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-[0.85rem]';
  const here = (key: string) => c.w.settings.find((s) => s.unitId === unitId && s.key === key);
  const lockedAbove = (e: EffectivePolicy | undefined) => (e?.enforcedBy && e.enforcedBy !== unitId ? e.enforcedBy : null);
  const provenance = (e: EffectivePolicy | undefined) => {
    const s = e?.source ? c.w.settings.find((x) => x.unitId === e.source && x.key === e.key) : undefined;
    if (!s) return <p className="mt-1 text-[0.8rem] text-ink-500">{e?.chain.length ? t('The default applies.', 'Діє типове значення.') : t('The default: nobody has set it.', 'Типове значення: ніхто його не задавав.')}</p>;
    const note = settingNote(s.note, locale);
    return (
      <p className="mt-1 text-[0.8rem] text-ink-500">
        {t('Set by', 'Задав(ла)')} <span className="text-ink-700">{c.personName(s.setBy)}</span> {t('at', 'на рівні')} <span className="text-ink-700">{c.unitName(s.unitId)}</span> · {when(s.setAt, locale)}{note ? <span className="block">{note}</span> : null}
        {e?.enforcedBy ? <span className="annot mt-1 inline-flex items-center gap-1 bg-sunrise-500 px-1.5 py-0.5 text-[0.55rem] text-ink-900"><Icon name="lock" className="size-3" />{t('enforced by', 'закріплено')} {c.unitName(e.enforcedBy)}</span> : null}
      </p>
    );
  };
  // A setting kept at this unit that the resolution ignores: lower than what applies from above, under an enforced one, or blocked.
  const idle = (e: EffectivePolicy | undefined, show: (v: unknown) => string) => {
    const step = e?.chain.find((x) => x.unitId === unitId && x.outcome !== 'applied' && x.outcome !== 'narrowed');
    if (!step) return null;
    const why = step.outcome === 'looser' ? (e?.key === 'routing.minApproval.bps' ? t(`it is below ${pct(floor)}, the lowest the threshold can be here`, `воно нижче за ${pct(floor)} — найнижчий поріг, можливий тут`) : t('it is looser than what applies from above', 'воно ширше за те, що діє згори')) : step.outcome === 'below_enforced' ? t('a unit above enforces the policy', 'одиниця вище закріпила політику') : t('the unit blocks inheritance', 'одиниця блокує успадкування');
    return <p className="mt-1 border-l-2 border-attention-500 pl-2 text-[0.8rem] text-attention-500">{t(`The setting kept here, ${show(step.value)}, takes no effect: ${why}.`, `Налаштування, збережене тут (${show(step.value)}), не діє: ${why}.`)}</p>;
  };
  const note = <input name="note" placeholder={t('Why — kept with the setting (optional)', 'Чому — зберігається з налаштуванням (необов’язково)')} className={`${field} min-w-0 flex-1`} />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0">
        <p className="annot text-[0.6rem] text-ink-500">{t('Strategy', 'Стратегія')}</p>
        <p className="mt-1 text-[1.2rem] font-semibold text-ink-900">{strategyText(strategy, locale).name}</p>
        <p className="mt-0.5 text-[0.88rem] text-ink-700">{strategyText(strategy, locale).line}</p>
        {provenance(strategyPolicy)}
        {idle(strategyPolicy, (v) => strategyText(String(v), locale).name)}
        {canWrite && !lockedAbove(strategyPolicy) ? (
          <RoutingPolicyForm unitId={unitId} policyKey="routing.strategy" kind="enum" back={back} mode={here('routing.strategy')?.mode ?? 'default'} submit={t('Set the strategy', 'Задати стратегію')} className="mt-4 flex flex-wrap items-center gap-2 border-t border-graphite/20 pt-3">
            <fieldset className="w-full space-y-1.5">
              <legend className="sr-only">{t('Strategy', 'Стратегія')}</legend>
              {strategies.map((s) => (
                <label key={s} className="flex cursor-pointer items-start gap-2 border border-graphite/25 px-3 py-2 has-[:checked]:border-ink-900 has-[:checked]:bg-paper-deep">
                  <input type="radio" name="value" value={s} defaultChecked={s === strategy} className="mt-1" />
                  <span className="min-w-0"><span className="font-semibold text-ink-900">{strategyText(s, locale).name}</span><span className="block text-[0.8rem] text-ink-500">{strategyText(s, locale).line}</span></span>
                </label>
              ))}
            </fieldset>
            {note}
          </RoutingPolicyForm>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="annot text-[0.6rem] text-ink-500">{t('Approval threshold', 'Поріг схвалення')}</p>
        <p className="mt-1 text-[1.2rem] font-semibold tabular-nums text-ink-900">{pct(threshold)}</p>
        <p className="mt-0.5 text-[0.88rem] text-ink-700">{t('An acquirer whose approval rate is below the threshold is never chosen to save on fees. A unit below may only raise it.', 'Еквайра, чий рівень схвалення нижчий за поріг, ніколи не обирають заради економії. Одиниця нижче може лише підвищити поріг.')}</p>
        {provenance(thresholdPolicy)}
        {idle(thresholdPolicy, (v) => (typeof v === 'number' ? pct(v) : String(v)))}
        {canWrite && !lockedAbove(thresholdPolicy) ? (
          <RoutingPolicyForm unitId={unitId} policyKey="routing.minApproval.bps" kind="percent" back={back} mode={here('routing.minApproval.bps')?.mode ?? 'default'} submit={t('Set the threshold', 'Задати поріг')} className="mt-4 flex flex-wrap items-center gap-2 border-t border-graphite/20 pt-3">
            <label className="flex items-center gap-1.5 text-[0.85rem] text-ink-700">
              <input name="value" type="number" min={floor / 100} max={100} step={0.5} defaultValue={threshold / 100} className={`${field} w-24 font-mono`} aria-label={t('Approval threshold, %', 'Поріг схвалення, %')} />%
            </label>
            {note}
            <p className="w-full text-[0.78rem] text-ink-500">{t(`Here it can only be raised: ${pct(floor)} is the lowest it can be set to and still take effect.`, `Тут його можна лише підвищити: ${pct(floor)} — найнижче значення, яке ще діятиме.`)}</p>
          </RoutingPolicyForm>
        ) : null}
      </div>
      {!canWrite ? <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] text-ink-500 lg:col-span-2">{t('Routing is changed in a profile with the right to change it:', 'Маршрутизацію змінюють у профілі з правом на це:')}{(['payments_manager', 'hierarchy_admin'] as const).map((r) => <span key={r} className="annot border border-graphite/25 px-1.5 py-0.5 text-[0.56rem] text-ink-700">{pickText(roleText(c.stand, r), locale)}</span>)}</p> : null}
      {!priced ? <p className="border-t border-graphite/20 pt-3 text-[0.82rem] text-ink-500 lg:col-span-2">{t('This assembly keeps no acquiring terms of its merchants: the PSP’s tariffs price the payments, so a strategy by cost has nothing to compare and approval first decides. The strategy matters where a merchant brings its own acquiring.', 'Ця збірка не зберігає умов еквайрингу своїх мерчантів: платежі оцінюють тарифи PSP, тож стратегії за вартістю нема з чим порівнювати, і вирішує «Спершу схвалення». Стратегія має значення там, де мерчант приходить із власним еквайрингом.')}</p> : null}
    </div>
  );
}
