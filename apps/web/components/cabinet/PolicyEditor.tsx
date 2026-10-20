import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { findInstrument } from '@river/psp-instruments';
import type { EffectivePolicy, PolicyDefinition, PolicySetting, Unit } from '@river/psp-units';
import { setPolicyAction } from '@/lib/actions/cabinet';
import { lt } from '@/lib/lt';
import { policyText } from '@/lib/policyText';
import { Icon } from '../ui/Icon';

const outcomeTone: Record<string, string> = { applied: 'text-teal-600', narrowed: 'text-river-700', looser: 'text-attention-500', below_enforced: 'text-ink-300 line-through', blocked: 'text-ink-300 line-through' };

/**
 * One policy of one unit, as a directory's resultant set of policy shows it: the value in effect, where
 * it comes from, the chain from the root down with what happened to each setting — and, for a person who
 * may set it here, a small form to set, enforce or clear it.
 */
export function PolicyEditor({ definition, effective, here, unit, units, locale, back, editable }: { definition: PolicyDefinition; effective: EffectivePolicy; here: PolicySetting | undefined; unit: Unit; units: readonly Unit[]; locale: Locale; back: string; editable: boolean }) {
  const t = lt(locale);
  const name = (id: string) => pickText(units.find((u) => u.id === id)?.name, locale) || id;
  const text = (v: PolicySetting['value']) => policyText(definition, v, locale, unit.currency, name);
  const outcomes: Record<string, string> = { applied: t('applied', 'застосовано'), narrowed: t('narrowed', 'звужено'), looser: t('looser — ignored', 'ширше — ігнорується'), below_enforced: t('below an enforced one', 'нижче закріпленої'), blocked: t('blocked', 'заблоковано') };
  const current = here?.value ?? effective.value;
  const field = 'border border-graphite/30 bg-paper px-2 py-1 text-[0.82rem]';
  const control = (() => {
    switch (definition.kind) {
      case 'boolean': return <select name="value" defaultValue={String(current === true)} className={field}><option value="true">{t('yes', 'так')}</option><option value="false">{t('no', 'ні')}</option></select>;
      case 'enum': return <select name="value" defaultValue={String(current)} className={field}>{(definition.options ?? []).map((o) => <option key={o} value={o}>{policyText(definition, o, locale, unit.currency, name)}</option>)}</select>;
      case 'colour': return <input type="color" name="value" defaultValue={String(current)} className="h-8 w-14 border border-graphite/30" />;
      case 'money': return <input name="value" inputMode="decimal" defaultValue={typeof current === 'number' ? (current / 100).toFixed(2) : ''} placeholder={t('empty = no limit', 'порожньо = без ліміту')} className={`${field} w-36 font-mono`} />;
      case 'percent': return <input name="value" inputMode="decimal" defaultValue={typeof current === 'number' ? String(current / 100) : '0'} className={`${field} w-20 font-mono`} aria-label="%" />;
      case 'number': return <input name="value" type="number" defaultValue={typeof current === 'number' ? current : 0} className={`${field} w-24 font-mono`} />;
      case 'text': return definition.key === 'split.charity.recipient'
        ? <select name="value" defaultValue={String(current)} className={field}>{units.filter((u) => u.kind === 'merchant').map((u) => <option key={u.id} value={u.id}>{pickText(u.name, locale)}</option>)}</select>
        : <input name="value" defaultValue={String(current ?? '')} className={field} />;
      case 'list': {
        const selected = new Set(Array.isArray(current) ? current.map(String) : []);
        if (definition.options) {
          return (
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {definition.options.map((o) => {
                let label = o;
                try { label = definition.key.startsWith('agents') ? pickText(agentCatalogue.find((a) => a.id === o)?.name, locale) : definition.key === 'checkout.languages' ? (o === 'uk' ? 'УКР' : 'ENG') : pickText(findInstrument(o).label, locale); } catch { /* the option's own name */ }
                return <label key={o} className="flex items-center gap-1 text-[0.78rem]"><input type="checkbox" name="value" value={o} defaultChecked={selected.has(o)} />{label}</label>;
              })}
            </span>
          );
        }
        return <><input name="value" defaultValue={[...selected].join(', ')} className={`${field} w-48 font-mono`} />{definition.key === 'invoices.reminders' ? <input type="hidden" name="numeric" value="1" /> : null}</>;
      }
    }
  })();
  return (
    <div className="grid gap-x-6 gap-y-2 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2"><span className="font-semibold text-ink-900">{pickText(definition.label, locale)}</span><span className="font-mono text-[0.68rem] text-ink-500">{definition.key}</span></p>
        <p className="mt-0.5 text-[0.8rem] text-ink-500">{pickText(definition.help, locale)}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.9rem]">
          {definition.kind === 'colour' ? <span className="inline-block size-3.5 border border-ink-900" style={{ background: String(effective.value) }} /> : null}
          <b className="font-semibold text-ink-900">{text(effective.value)}</b>
          {effective.enforcedBy ? <span className="annot inline-flex items-center gap-1 bg-sunrise-500 px-1.5 py-0.5 text-[0.55rem] text-ink-900"><Icon name="lock" className="size-3" />{t('enforced by', 'закріплено')} {name(effective.enforcedBy)}</span> : null}
          <span className="annot text-[0.58rem] text-ink-500">{effective.source ? `${t('from', 'від')} ${name(effective.source)}` : t('the default', 'типове значення')}</span>
        </p>
      </div>
      <div className="min-w-0">
        {effective.chain.length > 0 ? (
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.75rem]">
            {effective.chain.map((step, i) => (
              <li key={`${step.unitId}${i}`} className="flex items-center gap-1.5">
                {i > 0 ? <span className="text-ink-300">→</span> : null}
                <span className="border border-graphite/20 px-1.5 py-0.5"><span className="text-ink-700">{name(step.unitId)}</span>{step.mode === 'enforced' ? <Icon name="lock" className="ml-1 inline size-3 text-sunrise-600" /> : null} <span className={`font-mono ${outcomeTone[step.outcome]}`}>{text(step.value)}</span> <span className={`annot text-[0.5rem] ${outcomeTone[step.outcome]}`}>{outcomes[step.outcome]}</span></span>
              </li>
            ))}
          </ol>
        ) : <p className="annot text-[0.58rem] text-ink-300">{t('set nowhere above or here', 'ніде не задано')}</p>}
        {editable ? (
          <form action={setPolicyAction} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="hidden" name="unitId" value={unit.id} /><input type="hidden" name="key" value={definition.key} /><input type="hidden" name="kind" value={definition.kind} /><input type="hidden" name="back" value={back} />
            {control}
            <select name="mode" defaultValue={here?.mode ?? 'default'} className={field}><option value="default">{t('can be changed below', 'можна змінити нижче')}</option><option value="enforced">{t('enforced below', 'закріпити донизу')}</option></select>
            <button type="submit" className="annot border border-ink-900 px-2 py-1 text-[0.58rem] text-ink-900 hover:bg-ink-900 hover:text-paper">{t('Set here', 'Задати тут')}</button>
            {here ? <button type="submit" name="clear" value="1" className="annot border border-graphite/40 px-2 py-1 text-[0.58rem] text-ink-500 hover:border-ink-900">{t('Clear here', 'Скинути тут')}</button> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
