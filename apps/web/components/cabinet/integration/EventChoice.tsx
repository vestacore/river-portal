import { pickText, type Locale } from '@river/i18n';
import { boundaries, factCatalogue, projectionLabels } from '@river/psp-facts';
import { lt } from '@/lib/lt';

/**
 * The events an endpoint may hear: every fact the catalogue releases, by the boundary that owns it — and
 * `*`, all of them, including those released later. Checkboxes named `events`, as the endpoint action reads them.
 */
export function EventChoice({ locale, chosen = [] }: { locale: Locale; chosen?: ReadonlyArray<string> }) {
  const t = lt(locale);
  const released = factCatalogue.filter((d) => d.webhook);
  return (
    <fieldset className="min-w-0 border-t border-graphite/20 pt-3">
      <legend className="annot pr-2 text-[0.6rem] text-ink-500">{t('Events it hears', 'Події, які вона отримує')}</legend>
      <label className="mb-3 flex items-center gap-2 text-[0.85rem] text-ink-900">
        <input type="checkbox" name="events" value="*" defaultChecked={chosen.includes('*')} className="accent-ink-900" />
        {t('All events, including those released later', 'Усі події, зокрема ті, що з’являться згодом')}<span className="font-mono text-[0.72rem] text-ink-500">*</span>
      </label>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {boundaries.map((b) => (
          <div key={b} className="min-w-0">
            <p className="annot mb-1.5 text-[0.6rem] text-ink-900">{pickText(projectionLabels[b], locale)}</p>
            <ul className="space-y-1.5">
              {released.filter((d) => d.owner === b).map((d) => (
                <li key={d.type}>
                  <label className="flex items-start gap-2 text-[0.82rem] text-ink-700">
                    <input type="checkbox" name="events" value={d.type} defaultChecked={chosen.includes(d.type)} className="mt-1 accent-ink-900" />
                    <span className="min-w-0">{pickText(d.label, locale)}<span className="block font-mono text-[0.68rem] text-ink-500">{d.type}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
