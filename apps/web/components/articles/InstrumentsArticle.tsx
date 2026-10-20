import { pickText, type Locale } from '@river/i18n';
import { factDefinition, stages, stageCatalogue, type Stage } from '@river/psp-facts';
import { courseFor } from '@river/psp-flow';
import { acquirers, instrumentCatalogue } from '@river/psp-instruments';
import { effectiveFor, type World } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { capturedSince, sinceDays } from '@/lib/figures';
import { count, money, percent } from '@/lib/format';
import { instrumentIcon } from '@/lib/instrumentIcon';
import { lt } from '@/lib/lt';
import { HBars } from '../charts/HBars';
import { Icon } from '../ui/Icon';
import { ArticleFrame, Figure, Section } from './ArticleFrame';

/** Article 03 — payment instruments: twelve courses inside one river, their capabilities, where they are allowed, how they do. */
export function InstrumentsArticle({ locale, w }: { locale: Locale; w: World }) {
  const t = lt(locale);
  const cols: Stage[] = ['consent', 'secured', 'capture'];
  const label = (s: Stage) => pickText(stageCatalogue.find((x) => x.stage === s)!.label, locale);
  const from = sinceDays(30);
  const paid = capturedSince(w, from);
  const sessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from && s.instrument);
  const caps: Array<[keyof (typeof instrumentCatalogue)[number]['capabilities'], string, string]> = [['refunds', 'Refunds', 'Повернення'], ['partialRefunds', 'Partial refunds', 'Часткові повернення'], ['recurring', 'Recurring', 'Регулярні'], ['manualCapture', 'Capture later', 'Відкладене списання'], ['disputes', 'Disputes', 'Спори'], ['split', 'Split', 'Розщеплення']];
  const entities = ['ou-ua', 'ou-eu', 'ou-kvitka-pharmacy', 'ou-nordlicht'];
  return (
    <ArticleFrame locale={locale} slug="instruments" sheet="RP-03" title={t('Every instrument is first-class', 'Кожен інструмент — рівноправний')}
      lead={t('A card is one instrument among twelve. A transfer by IBAN, a QR code in the National Bank’s standard, a bank’s consent in its own app, instalments, pay later, an e-wallet, stablecoins, cash at a kiosk and a SEPA direct debit each have their own course of bridges — and the same river around them: the same screening and routing before, the same capture, split, ledger and receipt after.', 'Картка — один інструмент із дванадцяти. Переказ за IBAN, QR-код за стандартом Національного банку, згода банку в його застосунку, оплата частинами, оплата пізніше, е-гаманець, стейблкоїни, готівка в терміналі та пряме списання SEPA мають кожен власне русло мостів — і ту саму ріку довкола: ту саму перевірку й маршрутизацію до, те саме списання, розщеплення, облік і квитанцію після.')}
      cta={{ label: t('Pay with any of them', 'Сплатіть будь-яким із них'), path: '/shop' }}>
      <Section index="1" title={t('One river, twelve courses', 'Одна ріка, дванадцять русел')}>
        <p>{t('Every attempt opens at the source, chooses an instrument, is screened and routed. Then each instrument crosses its own bridges until the money is secured — a 3-D Secure challenge, a device’s token, a bank’s consent, a scan, a mandate, confirmations on a chain, a lender’s approval, cash at a kiosk. From the capture on, all of them are one river again.', 'Кожна спроба починається з витоку, обирає інструмент, проходить перевірку й маршрутизацію. Далі кожен інструмент перетинає власні мости, доки кошти не забезпечено: запит 3-D Secure, токен пристрою, згода банку, сканування, мандат, підтвердження в мережі, схвалення кредитора, готівка в терміналі. Від списання всі вони знову — одна ріка.')}</p>
        <Figure caption={t('Fig. 4 — the course of every instrument through the three stages where they differ; before and after, they share the river.', 'Рис. 4 — русло кожного інструменту через три стадії, де вони відрізняються; до і після вони мають спільну ріку.')}>
          <table className="w-full min-w-[760px] text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80"><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Instrument', 'Інструмент')}</th><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{stages.slice(1, 4).map(label).join(' · ')}</th>{cols.map((s) => <th key={s} className="annot px-2 py-2 text-[0.56rem] font-normal text-sunrise-600">{label(s)}</th>)}<th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{stages.slice(7).map(label).join(' · ')}</th></tr></thead>
            <tbody>{instrumentCatalogue.map((i) => {
              const course = courseFor(i.id, i.id === 'card');
              return (
                <tr key={i.id} className="border-b border-graphite/15 align-top">
                  <td className="px-2 py-2"><span className="flex items-center gap-2 font-semibold text-ink-900"><Icon name={instrumentIcon(i.id)} className="size-4 text-ink-500" />{pickText(i.label, locale)}</span></td>
                  <td className="px-2 py-2 text-ink-300">═══</td>
                  {cols.map((s) => <td key={s} className="px-2 py-2"><span className="flex flex-wrap gap-1">{course.filter((f) => factDefinition(f).stage === s).map((f) => <span key={f} className="border border-graphite/30 bg-river-100 px-1.5 py-0.5 text-[0.72rem] text-ink-900" title={f}>{pickText(factDefinition(f).label, locale)}</span>)}</span></td>)}
                  <td className="px-2 py-2 text-ink-300">═══</td>
                </tr>
              );
            })}</tbody>
          </table>
        </Figure>
      </Section>

      <Section index="2" title={t('What each can do after the mouth', 'Що кожен уміє після гирла')}>
        <p>{t('Instruments differ in what happens later: whether money can be given back in part, charged again, captured at shipment or disputed by a scheme. The pay page and the cabinets read these capabilities from the same catalogue, so an operator is never offered a partial refund an instrument cannot do.', 'Інструменти відрізняються тим, що буває пізніше: чи можна повернути частину грошей, списувати регулярно, списати при відвантаженні, чи може платіжна система оскаржити. Сторінка оплати й кабінети читають ці можливості з того самого каталогу, тож операціоністу ніколи не запропонують часткове повернення, якого інструмент не вміє.')}</p>
        <div className="not-prose overflow-x-auto border border-graphite/20">
          <table className="w-full text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80"><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Instrument', 'Інструмент')}</th><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Who sends the money', 'Хто надсилає гроші')}</th>{caps.map(([, en, uk]) => <th key={en} className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t(en, uk)}</th>)}<th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Payout', 'Виплата')}</th><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Typical fee', 'Типова комісія')}</th></tr></thead>
            <tbody>{instrumentCatalogue.map((i) => <tr key={i.id} className="border-b border-graphite/15"><td className="px-2 py-1.5 text-ink-900">{pickText(i.label, locale)}</td><td className="px-2 py-1.5 text-ink-700">{i.push ? t('the payer pushes', 'платник надсилає') : t('taken with consent', 'списується за згодою')}</td>{caps.map(([k]) => <td key={k} className="px-2 py-1.5">{i.capabilities[k] ? <Icon name="check" className="size-4 text-teal-600" /> : <span className="text-ink-300">—</span>}</td>)}<td className="px-2 py-1.5 font-mono">T+{i.settlementDays}</td><td className="px-2 py-1.5 tabular-nums">{percent(i.typicalFeeBps, locale, 2)}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>

      <Section index="3" title={t('Where each is allowed', 'Де кожен дозволено')}>
        <p>{t('Instruments are allowed by policy, down the hierarchy. The Ukrainian entity allows what its regulator and its banks carry; the European one its own set; a pharmacy’s tills narrow the entity’s list to what a counter needs; a software firm offers debits and transfers for its subscriptions. A unit can only take instruments away from the list above it.', 'Інструменти дозволяються політикою, донизу ієрархією. Українська юрособа дозволяє те, що підтримують її регулятор і банки; європейська — свій набір; каси аптеки звужують список юрособи до потрібного біля прилавка; софтверна компанія пропонує для підписок списання й перекази. Одиниця може лише прибирати інструменти зі списку вище.')}</p>
        <ul>{entities.map((id) => <li key={id}><b>{pickText(w.units.find((u) => u.id === id)?.name, locale)}</b>: {((policyValue(effectiveFor(w, id), 'instruments.allowed') as string[]) ?? []).map((x) => pickText(instrumentCatalogue.find((i) => i.id === x)!.label, locale)).join(', ')}</li>)}</ul>
      </Section>

      <Section index="4" title={t('How they did in the last 30 days', 'Як вони працювали за останні 30 днів')}>
        <div className="not-prose border border-graphite/20 bg-paper p-4">
          <HBars rows={instrumentCatalogue.map((i) => {
            const own = sessions.filter((s) => s.instrument === i.id);
            const secured = own.filter((s) => s.paymentId).length;
            const p = paid.filter((x) => x.instrument === i.id);
            return { label: pickText(i.label, locale), value: p.length, display: count(p.length, locale), note: `${own.length ? Math.round((secured / own.length) * 100) : 0} % · ${p.filter((x) => x.currency === 'UAH').length ? money(p.filter((x) => x.currency === 'UAH').reduce((s, x) => s + x.capturedMinor, 0), 'UAH', locale, true) : money(p.reduce((s, x) => s + x.capturedMinor, 0), 'EUR', locale, true)}`, tone: 'river' as const };
          }).sort((a, b) => b.value - a.value)} />
          <p className="annot mt-3 text-[0.56rem] text-ink-500">{t('payments · share of attempts that secured funds · captured', 'платежів · частка спроб, що забезпечили кошти · списано')}</p>
        </div>
      </Section>

      <Section index="5" title={t('Who carries them', 'Хто їх проводить')}>
        <p>{t('Each instrument rides a rail — card, wallet, account-to-account, transfer, QR, credit, chain, cash, debit — and each rail has its acquirers, banks or lenders. In this demo all of them are stand-ins with invented names; the routing bridge chooses among them by rule and by weight.', 'Кожен інструмент їде своєю рейкою — картка, гаманець, рахунок-рахунок, переказ, QR, кредит, мережа, готівка, списання — і кожна рейка має своїх еквайрів, банки чи кредиторів. У цьому демо всі вони — імітатори з вигаданими назвами; міст маршрутизації обирає між ними за правилом і за вагою.')}</p>
        <ul>{acquirers.map((a) => <li key={a.id}><b>{a.name}</b> — {a.rails.join(', ')} · {a.regions.join(', ')}</li>)}</ul>
      </Section>
    </ArticleFrame>
  );
}
