import { pickText } from '@river/i18n';
import { boundaries, factCatalogue, projectionLabels, stageCatalogue, type Boundary, type PspFact, type Speaker } from '@river/psp-facts';
import { webhookEventOf } from '@river/psp-integration';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { JsonBlock } from '@/components/cabinet/integration/CodeBlock';
import { unitOfFact } from '@/components/cabinet/integration/facts';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { Status, Value } from '@/components/panels/Value';
import { cabinet } from '@/lib/cabinet';
import { when } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery } from '@/lib/table';

const badge: Record<Speaker, string> = { door: 'bg-sunrise-500 text-ink-900', figure: 'bg-river-100 text-river-900', world: 'bg-teal-600 text-paper' };

/**
 * The catalogue of facts, as an integrator reads it: every fact type by the boundary that owns it — what it
 * means, where in the river it stands, who speaks it, which views it forms — and whether it is released as
 * a webhook, with the newest such event of the reach as an example.
 */
export default async function Events({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit);
  const { t } = c;
  const released = new Set(factCatalogue.filter((d) => d.webhook).map((d) => d.type));
  const examples = new Map<string, PspFact>();
  for (let i = c.w.log.length - 1; i >= 0 && examples.size < released.size; i -= 1) {
    const fact = c.w.log[i]!;
    if (!released.has(fact.type) || examples.has(fact.type)) continue;
    const unit = unitOfFact(c.w, fact);
    if (unit && c.visible.has(unit)) examples.set(fact.type, fact);
  }
  const speakers: Record<Speaker, [string, string]> = {
    door: [t('door', 'двері'), t('a person at the door: a payer, a merchant, an operator, your server', 'людина біля дверей: платник, мерчант, операціоніст, ваш сервер')],
    figure: [t('figure', 'фігура'), t('a figure of the machine: risk, routing, the split', 'фігура машини: ризики, маршрутизація, розщеплення')],
    world: [t('world', 'світ'), t('the world beyond: an issuer, a bank, a wallet, a chain, the clock', 'світ поза нами: емітент, банк, гаманець, блокчейн, годинник')],
  };
  const about: Record<Boundary, string> = {
    order: t('What is bought, from whom, and how its money will be distributed.', 'Що купують, у кого і як буде розподілено гроші.'),
    invoice: t('The payable claim: how much, by when, and how much is still due.', 'Вимога до сплати: скільки, до коли і скільки ще належить сплатити.'),
    session: t('One attempt to pay an invoice — the river itself, from unpaid to paid.', 'Одна спроба сплатити інвойс — сама ріка, від несплаченого до сплаченого.'),
    payment: t('Money an attempt secured, and its life after the mouth: refunds, disputes, payouts.', 'Гроші, які забезпечила спроба, і їхнє життя після гирла: повернення, спори, виплати.'),
  };
  const shown = factCatalogue.filter((d) => (!query.released || (query.released === 'yes') === d.webhook) && (!query.speaker || d.speaker === query.speaker)
    && matches(query.q, d.type, pickText(d.label, locale), pickText(d.meaning, locale)));
  return (
    <>
      <CabinetHead kicker={t('Integration', 'Інтеграція')} title={t('Event catalogue', 'Каталог подій')}
        lead={t('Facts are the bridges of the river: each says once what happened, and every view is formed from them. A webhook is a released fact — sent as it is stored. Every event id names one fact in its stream, so a receiver deduplicates on it: a retry is the same event, never a new one.', 'Факти — це мости ріки: кожен один раз каже, що сталося, і з них формується кожна проєкція. Вебхук — це випущений факт, надісланий таким, яким його записано. Кожен id події називає один факт у його потоці, тож одержувач усуває дублікати саме за ним: повтор — та сама подія, а не нова.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Panel title={t('What an event carries', 'Що несе подія')} className="mb-6">
        <dl className="grid gap-x-6 gap-y-3 text-[0.88rem] sm:grid-cols-2 xl:grid-cols-5">
          {([
            ['id', t('evt_<stream>_<seq>: names one fact in its stream. Deduplicate on it.', 'evt_<потік>_<номер>: називає один факт у його потоці. Усувайте дублікати за ним.')],
            ['type', t('The fact type, as in this catalogue.', 'Тип факту, як у цьому каталозі.')],
            ['created', t('When the fact entered the river.', 'Коли факт увійшов у ріку.')],
            ['stream', t('The stream it belongs to: an order, an invoice, a session or a payment.', 'Потік, якому він належить: замовлення, інвойс, сесія чи платіж.')],
            ['data', t('The fact’s payload, exactly as stored — never a card number or a name.', 'Дані факту, точно як записано, — ніколи номер картки чи ім’я.')],
          ] as const).map(([k, v]) => (
            <div key={k} className="border-t border-graphite/15 pt-2"><dt className="font-mono text-[0.8rem] text-ink-900">{k}</dt><dd className="mt-1 text-ink-700">{v}</dd></div>
          ))}
        </dl>
      </Panel>
      <FilterBar locale={locale} query={query} groups={[
        { param: 'released', label: t('Webhook', 'Вебхук'), options: [{ value: 'yes', label: t('released', 'випускається'), count: factCatalogue.filter((d) => d.webhook).length }, { value: 'no', label: t('kept inside', 'лишається всередині'), count: factCatalogue.filter((d) => !d.webhook).length }] },
        { param: 'speaker', label: t('Who speaks', 'Хто говорить'), options: (['door', 'figure', 'world'] as const).map((s) => ({ value: s, label: speakers[s][0], count: factCatalogue.filter((d) => d.speaker === s).length })) },
      ]} />
      <div className="space-y-6">
        {boundaries.map((b) => {
          const defs = shown.filter((d) => d.owner === b);
          if (defs.length === 0) return null;
          const all = factCatalogue.filter((d) => d.owner === b);
          return (
            <Panel key={b} flush title={`${pickText(projectionLabels[b], locale)} · ${t(`${all.length} fact types, ${all.filter((d) => d.webhook).length} released`, `типів фактів: ${all.length}, випускається: ${all.filter((d) => d.webhook).length}`)}`} note={about[b]}>
              <ol className="divide-y divide-graphite/15">
                {defs.map((d) => {
                  const stage = stageCatalogue.find((s) => s.stage === d.stage);
                  const example = examples.get(d.type);
                  const event = example ? webhookEventOf(example) : null;
                  return (
                    <li key={d.type} id={d.type} className="grid gap-x-6 gap-y-3 px-4 py-4 target:bg-sunrise-100 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.35fr)]">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-x-2.5"><span className="font-semibold text-ink-900">{pickText(d.label, locale)}</span><span className="font-mono text-[0.78rem] text-ink-500">{d.type}</span></p>
                        <p className="mt-1 text-[0.88rem] text-ink-700">{pickText(d.meaning, locale)}</p>
                      </div>
                      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5 text-[0.82rem]">
                        <dt className="annot text-[0.58rem] text-ink-500">{t('Stage', 'Стадія')}</dt>
                        <dd className="text-ink-900">{stage ? pickText(stage.label, locale) : <span className="text-ink-300">—</span>}</dd>
                        <dt className="annot text-[0.58rem] text-ink-500">{t('Speaker', 'Хто говорить')}</dt>
                        <dd className="flex flex-wrap items-center gap-2"><span className={`annot px-1.5 py-0.5 text-[0.55rem] ${badge[d.speaker]}`}>{speakers[d.speaker][0]}</span><span className="text-[0.75rem] text-ink-500">{speakers[d.speaker][1]}</span></dd>
                        <dt className="annot text-[0.58rem] text-ink-500">{t('Forms', 'Формує')}</dt>
                        <dd><Value cell={{ kind: 'tags', items: d.forms.map((p) => ({ label: pickText(projectionLabels[p], locale), tone: p === 'ledger' ? 'accent' as const : undefined })) }} locale={locale} /></dd>
                      </dl>
                      <div className="min-w-0">
                        {d.webhook ? <Status label={t('released as a webhook', 'випускається як вебхук')} tone="success" /> : <Status label={t('kept inside the river', 'лишається всередині ріки')} tone="neutral" />}
                        {d.webhook ? (event && example ? (
                          <details className="mt-2">
                            <summary className="annot cursor-pointer text-[0.6rem] text-river-700 hover:text-ink-900">{t('Example: the newest in your reach', 'Приклад: найновіша у ваших межах')} · {when(example.at, locale)}</summary>
                            <div className="mt-2"><JsonBlock value={event} locale={locale} lines={25} /></div>
                          </details>
                        ) : <p className="mt-1.5 text-[0.8rem] text-ink-500">{t('No such event in your reach yet.', 'У ваших межах такої події ще не було.')}</p>) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          );
        })}
        {shown.length === 0 ? <p className="py-10 text-center text-ink-500">{t('No fact type matches.', 'Жоден тип факту не підходить.')}</p> : null}
      </div>
    </>
  );
}
