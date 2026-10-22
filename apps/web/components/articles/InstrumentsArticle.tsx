import { pickText, type Locale } from '@river/i18n';
import { factDefinition, stages, stageCatalogue, type Stage } from '@river/psp-facts';
import { courseFor } from '@river/psp-flow';
import { acquirers, instrumentCatalogue } from '@river/psp-instruments';
import { effectiveFor } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { capturedSince, sinceDays } from '@/lib/figures';
import { count, money, percent } from '@/lib/format';
import { instrumentIcon } from '@/lib/instrumentIcon';
import { lt } from '@/lib/lt';
import { HBars } from '../charts/HBars';
import { Icon } from '../ui/Icon';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

/** Article 04 — payment instruments: what the group offers in each channel, the course of each, what each can do, bonus points as a tender, how they did, who carries them. */
export function InstrumentsArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const cols: Stage[] = ['consent', 'secured', 'capture'];
  const label = (s: Stage) => pickText(stageCatalogue.find((x) => x.stage === s)!.label, locale);
  const from = sinceDays(30);
  const paid = capturedSince(w, from);
  const sessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from && s.instrument);
  const caps: Array<[keyof (typeof instrumentCatalogue)[number]['capabilities'], string, string]> = [['refunds', 'Refunds', 'Повернення'], ['partialRefunds', 'Partial refunds', 'Часткові повернення'], ['recurring', 'Recurring', 'Регулярні'], ['manualCapture', 'Capture later', 'Відкладене списання'], ['disputes', 'Disputes', 'Спори'], ['split', 'Split', 'Розподіл']];
  const channels: Array<[string, string, string]> = [['rt-web', 'The website', 'Сайт'], ['rt-app', 'The app', 'Застосунок'], ['rt-door', 'Payment at the door', 'Оплата при отриманні'], ['rt-b2b', 'Corporate customers', 'Корпоративні клієнти']];
  const allowed = (unitId: string) => ((policyValue(effectiveFor(w, unitId), 'instruments.allowed') as string[] | undefined) ?? []).filter((x) => x !== 'bonus_points');
  const name = (id: string) => pickText(instrumentCatalogue.find((i) => i.id === id)?.label, locale) || id;
  const used = instrumentCatalogue.filter((i) => paid.some((p) => p.instrument === i.id) || channels.some(([u]) => allowed(u).includes(i.id)));
  const bonus = paid.filter((p) => p.instrument === 'bonus_points');
  const bonusOrders = new Set(bonus.map((p) => p.orderId));
  const onlineOrders = new Set(paid.filter((p) => p.merchantId === 'rt-online').map((p) => p.orderId));
  const pspInstruments = new Set([...worlds.psp.views.payments.values()].map((p) => p.instrument));
  const elsewhere = instrumentCatalogue.filter((i) => pspInstruments.has(i.id) && !used.some((u) => u.id === i.id));
  const providers = acquirers.filter((a) => w.providers.includes(a.id));
  const terms = (id: string) => w.acquiring.find((x) => x.acquirerId === id && x.channel === 'online');
  return (
    <ArticleFrame locale={locale} slug="instruments" sheet="RP-04" title={t('Payment instruments', 'Платіжні інструменти')}
      lead={t('A retail group accepts more than cards online: device wallets, pay by bank, the National Bank’s QR code and instant transfers, bank transfers for corporate invoices, instalments, and its own bonus points. Each instrument has its own course — a 3-D Secure check, a bank’s consent, a scan, a lender’s approval — and the same handling around it: the same screening and routing before, the same capture, distribution, settlement and receipt after.', 'Роздрібна група онлайн приймає не лише картки: гаманці пристроїв, оплату з банку, QR-код і миттєві перекази Національного банку, банківські перекази за корпоративними інвойсами, оплату частинами й власні бонусні бали. Кожен інструмент має власне русло — перевірку 3-D Secure, згоду банку, сканування, схвалення кредитора — і однакову обробку довкола: ту саму перевірку й маршрутизацію до, те саме списання, розподіл, розрахунок і квитанцію після.')}
      cta={{ label: t('Pay with any of them', 'Сплатіть будь-яким із них'), path: '/shop' }}>
      <Section index="1" title={t('What each channel offers', 'Що пропонує кожен канал')}>
        <p>{t('Instruments are allowed by policy, down the group’s structure, and a channel can only narrow the list of the unit above it. The demo group offers:', 'Інструменти дозволяються політикою, донизу структурою групи, і канал може лише звузити список одиниці над ним. Демо-група пропонує:')}</p>
        <ul>{channels.map(([u, en, uk]) => <li key={u}><b>{t(en, uk)}</b>: {allowed(u).map(name).join(', ')}</li>)}</ul>
        <p>{t('Payment at the door works after picking: the courier brings the exact amount as a QR code, and the payer pays by a transfer or a card. Corporate customers receive an invoice with terms and pay by bank transfer; the reminders follow a policy.', 'Оплата при отриманні відбувається після комплектації: кур’єр приносить точну суму як QR-код, і платник сплачує переказом чи карткою. Корпоративні клієнти отримують інвойс з умовами оплати й сплачують банківським переказом; нагадування надсилаються за політикою.')}</p>
      </Section>

      <Section index="2" title={t('One flow, different courses', 'Один потік, різні русла')}>
        <p>{t('Every attempt starts the same way: an instrument is chosen, the attempt is screened and routed. Then each instrument passes its own events until the money is secured. From the capture on, all of them follow one course again.', 'Кожна спроба починається однаково: обирають інструмент, спробу перевіряють і маршрутизують. Далі кожен інструмент проходить власні події, доки кошти не забезпечено. Від списання всі вони знову йдуть одним руслом.')}</p>
        <Figure caption={t('Fig. 4.1 — the course of each instrument through the three stages where they differ; before and after, the course is shared.', 'Рис. 4.1 — русло кожного інструменту через три стадії, де вони відрізняються; до і після русло спільне.')}>
          <table className="w-full min-w-[760px] text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80"><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Instrument', 'Інструмент')}</th><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{stages.slice(1, 4).map(label).join(' · ')}</th>{cols.map((s) => <th key={s} className="annot px-2 py-2 text-[0.56rem] font-normal text-sunrise-600">{label(s)}</th>)}<th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{stages.slice(7).map(label).join(' · ')}</th></tr></thead>
            <tbody>{used.map((i) => {
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

      <Section index="3" title={t('What each can do afterwards', 'Що кожен уміє згодом')}>
        <p>{t('Instruments differ in what can happen later: whether money can be held and captured after picking, given back in part, charged again or disputed by a scheme. The pay page and the cabinets read these capabilities from the same catalogue, so an operator is never offered a partial refund an instrument cannot do, and an instrument that cannot hold money is paid at once and refunded the difference after picking.', 'Інструменти відрізняються тим, що можливо згодом: чи можна заблокувати кошти й списати після комплектації, повернути частину, списувати регулярно, чи може платіжна система оскаржити платіж. Сторінка оплати й кабінети читають ці можливості з одного каталогу, тож операціоністу ніколи не запропонують часткове повернення, якого інструмент не вміє, а інструментом, що не блокує кошти, платять одразу й отримують різницю поверненням після комплектації.')}</p>
        <div className="not-prose overflow-x-auto border border-graphite/20">
          <table className="w-full min-w-[720px] text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80"><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Instrument', 'Інструмент')}</th><th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Who sends the money', 'Хто надсилає гроші')}</th>{caps.map(([, en, uk]) => <th key={en} className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t(en, uk)}</th>)}<th className="annot px-2 py-2 text-[0.56rem] font-normal text-ink-500">{t('Settles', 'Розрахунок')}</th></tr></thead>
            <tbody>{used.map((i) => <tr key={i.id} className="border-b border-graphite/15"><td className="px-2 py-1.5 text-ink-900">{pickText(i.label, locale)}</td><td className="px-2 py-1.5 text-ink-700">{i.push ? t('the payer sends', 'платник надсилає') : t('taken with consent', 'списується за згодою')}</td>{caps.map(([k]) => <td key={k} className="px-2 py-1.5">{i.capabilities[k] ? <Icon name="check" className="size-4 text-teal-600" /> : <span className="text-ink-300">—</span>}</td>)}<td className="px-2 py-1.5 font-mono">T+{i.settlementDays}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>

      <Section index="4" title={t('Bonus points as a tender', 'Бонусні бали як спосіб оплати')}>
        <p>{t('The group’s bonus system stays where it is and keeps its own rules. The platform connects to it: the pay page shows the payer’s balance, the points the payer chooses are reserved and then redeemed as a part of the order, and a refund returns them. Points and a card are two payments of one order; the order is paid when together they cover the picked amount, and if the card part fails the points are given back.', 'Бонусна система групи лишається на своєму місці й працює за власними правилами. Платформа під’єднується до неї: сторінка оплати показує баланс платника, обрані бали резервуються, а потім списуються як частина замовлення, а повернення повертає їх. Бали й картка — два платежі одного замовлення; замовлення сплачене, коли разом вони покривають суму комплектації, а якщо карткова частина не пройде, бали повертаються.')}</p>
        <p>{t(`In the last 30 days points paid part of ${count(bonusOrders.size, locale)} online orders (${percent(onlineOrders.size ? Math.round((bonusOrders.size / onlineOrders.size) * 10_000) : 0, locale)}), ${money(bonus.reduce((s, p) => s + p.capturedMinor, 0), 'UAH', locale)} in all. The bonus system reports them in a daily batch like a bank, and the batch is reconciled like any other.`, `За останні 30 днів бали сплатили частину ${count(bonusOrders.size, locale)} онлайн-замовлень (${percent(onlineOrders.size ? Math.round((bonusOrders.size / onlineOrders.size) * 10_000) : 0, locale)}), разом ${money(bonus.reduce((s, p) => s + p.capturedMinor, 0), 'UAH', locale)}. Бонусна система звітує про них щоденним пакетом, як банк, і цей пакет звіряється так само, як інші.`)}</p>
      </Section>

      <Section index="5" title={t('How they did in the last 30 days', 'Як вони працювали за останні 30 днів')}>
        <div className="not-prose border border-graphite/20 bg-paper p-4">
          <HBars rows={used.map((i) => {
            const own = sessions.filter((s) => s.instrument === i.id);
            const secured = own.filter((s) => s.paymentId).length;
            const p = paid.filter((x) => x.instrument === i.id);
            return { label: pickText(i.label, locale), value: p.length, display: count(p.length, locale), note: `${own.length ? Math.round((secured / own.length) * 100) : 0} % · ${money(p.reduce((s, x) => s + x.capturedMinor, 0), 'UAH', locale, true)}`, tone: 'river' as const };
          }).sort((a, b) => b.value - a.value)} />
          <p className="annot mt-3 text-[0.56rem] text-ink-500">{t('payments · share of attempts that secured funds · captured', 'платежів · частка спроб, що забезпечили кошти · списано')}</p>
        </div>
      </Section>

      <Section index="6" title={t('Who carries them', 'Хто їх проводить')}>
        <p>{t('Each instrument rides a rail — card, account-to-account, transfer, QR, credit, loyalty — and each rail has the providers the group has agreements with. In this demo all of them are stand-ins with invented names:', 'Кожен інструмент проходить своєю рейкою — картка, рахунок-рахунок, переказ, QR, кредит, лояльність, — і для кожної рейки є провайдери, з якими в групи укладено договори. У цьому демо всі вони — імітатори з вигаданими назвами:')}</p>
        <ul>{providers.map((a) => { const x = terms(a.id); return <li key={a.id}><b>{pickText(a.label, locale)}</b> — {a.rails.join(', ')}{x ? ` · ${pickText(x.note, locale)}` : ''}</li>; })}</ul>
        {elsewhere.length > 0 ? <p>{t('The same catalogue serves the platform’s other assemblies. The PSP assembly of the demo also carries', 'Той самий каталог слугує іншим збіркам платформи. PSP-збірка демо також проводить')} {elsewhere.map((i) => pickText(i.label, locale).toLowerCase()).join(', ')}.</p> : null}
      </Section>
    </ArticleFrame>
  );
}
