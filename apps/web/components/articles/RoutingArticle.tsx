import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { acquiringCostOf, acquiringModelLabels, type AcquiringTerms } from '@river/psp-contracts';
import type { CardProduct } from '@river/psp-instruments';
import { acquirers, issuers } from '@river/psp-instruments';
import { effectiveFor, posOutlook, simulateRouting } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { cardCostSince, routingWeeks, strategyChange } from '@/lib/routingFigures';
import { count, day, money, percent } from '@/lib/format';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { LineChart } from '../charts/LineChart';
import { InsightCard } from '../cabinet/InsightCard';
import { OnUsFigure } from '../river/OnUsFigure';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

const th = 'annot px-3 py-2 text-[0.56rem] font-normal text-ink-500';

/** Article 01 — routing and the cost of acceptance: what a card payment costs, on-us, the routing decision, what it changed, the tills, other rails. */
export function RoutingArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const now = new Date().toISOString();
  const from = new Date(Date.parse(now) - 30 * 86_400_000).toISOString();
  const acquirerName = (id: string) => pickText(acquirers.find((a) => a.id === id)?.label, locale) || id;
  const bankName = (id: string | null) => (id ? pickText(issuers.find((i) => i.id === id)?.name, locale) : t('a foreign or unknown bank', 'іноземний чи невідомий банк'));
  const cardAcquirers = acquirers.filter((a) => a.rails.includes('card') && w.providers.includes(a.id));
  const online = (id: string) => w.acquiring.find((x) => x.acquirerId === id && x.channel === 'online');
  const strategyWord: Record<string, [string, string, string, string]> = {
    approval_first: ['Approval first', 'Спершу схвалення', 'traffic goes to the acquirers with the best approval, shared by weight; cost is not considered.', 'трафік іде до еквайрів із найкращим схваленням, розподілений за вагами; вартість не враховується.'],
    least_cost: ['Least cost', 'Найменша вартість', 'the acquirer with the lowest expected fee for this card under the group’s agreement.', 'еквайр із найменшою очікуваною комісією для цієї картки за договором групи.'],
    on_us_first: ['On-us first', 'Спершу on-us', 'the card’s own bank, if the group has an on-us rate with it; otherwise the least cost.', 'власний банк картки, якщо в групи є з ним ставка on-us; інакше — найменша вартість.'],
  };
  const sw = (s: string) => t(strategyWord[s]?.[0] ?? s, strategyWord[s]?.[1] ?? s);

  // § 1–2: the cost of one payment of 1,000 hryvnias on different cards, at each acquirer of the group.
  const amount = 100_000;
  const examples: Array<{ issuer: string; product: CardProduct; scheme: string; en: string; uk: string }> = [
    { issuer: 'bank-dnipro', product: 'debit', scheme: 'visa', en: 'Debit card of Bank Dnipro', uk: 'Дебетова картка Банку Дніпро' },
    { issuer: 'bank-stepove', product: 'credit', scheme: 'mastercard', en: 'Credit card of Stepove Bank', uk: 'Кредитна картка Степового банку' },
    { issuer: 'bank-karpaty', product: 'debit', scheme: 'visa', en: 'Debit card of Karpaty Bank', uk: 'Дебетова картка Карпати Банку' },
    { issuer: 'bank-polissia', product: 'debit', scheme: 'visa', en: 'Debit card of Polissia Bank (does not acquire)', uk: 'Дебетова картка Поліського банку (не займається еквайрингом)' },
    { issuer: 'bank-dnipro', product: 'commercial', scheme: 'mastercard', en: 'Corporate card of Bank Dnipro', uk: 'Корпоративна картка Банку Дніпро' },
  ];
  const costAt = (terms: AcquiringTerms, issuer: string, product: CardProduct, scheme: string) => {
    const onUs = (issuers.find((i) => i.id === issuer)?.acquirerIds ?? []).includes(terms.acquirerId);
    return { onUs: onUs && terms.onUsBps !== null, cost: acquiringCostOf(terms, { scheme, product, domestic: true, onUs }, amount) };
  };

  // § 2: whose cards the group's online payers carry.
  const cardSessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from && s.route?.rail === 'card');
  const mix = new Map<string | null, number>();
  for (const s of cardSessions) mix.set(s.route!.issuer, (mix.get(s.route!.issuer) ?? 0) + 1);
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]);
  const ownShare = cardSessions.length ? Math.round((cardSessions.filter((s) => s.route!.issuer && (issuers.find((i) => i.id === s.route!.issuer)?.acquirerIds ?? []).some((a) => w.providers.includes(a))).length / cardSessions.length) * 10_000) : 0;

  // § 3: one real decision, with every acquirer considered.
  const decided = [...w.views.sessions.values()].filter((s) => s.route?.rule === 'on-us' && s.outcome === 'succeeded').at(-1);
  const chosen = decided ? (w.streams.get(decided.sessionId) ?? []).find((f) => f.type === 'route.Chosen') : undefined;
  const alternatives = (chosen?.payload as { alternatives?: Array<{ acquirer: string; feeMinor: number | null; approvalBps: number; onUs: boolean; eligible: boolean }> } | undefined)?.alternatives ?? [];
  const minApproval = Number(policyValue(effectiveFor(w, 'rt-group'), 'routing.minApproval.bps') ?? 9_000);

  // § 4: what the change of strategy did.
  const change = strategyChange(w);
  const weeks = routingWeeks(w);
  const sim = simulateRouting(w, { from, minApprovalBps: minApproval });
  const cost = cardCostSince(w, from);
  const changedBy = change ? pickText(w.people.find((p) => p.id === change.setBy)?.name, locale) : '';
  const before = change ? weeks.filter((x) => x.week < change.setAt.slice(0, 10)) : [];
  const after = change ? weeks.filter((x) => x.week > change.setAt.slice(0, 10)) : [];
  const avg = (rows: typeof weeks, key: 'onUsBps' | 'rateBps') => (rows.length ? Math.round(rows.reduce((s, x) => s + x[key], 0) / rows.length) : 0);
  const dayLabel = (d: string) => new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(d));

  // § 5: the tills.
  const pos = posOutlook(w, now, 30);
  const regionName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale);
  const tillVolume = pos.reduce((s, p) => s + p.volumeMinor, 0);

  // § 6: other rails.
  const others = new Map<string, { count: number; grossMinor: number; feeMinor: number }>();
  for (const p of w.views.payments.values()) {
    if (!p.capturedAt || p.capturedAt < from || ['card', 'apple_pay', 'google_pay'].includes(p.instrument)) continue;
    const e = others.get(p.instrument) ?? { count: 0, grossMinor: 0, feeMinor: 0 };
    e.count += 1;
    e.grossMinor += p.capturedMinor;
    e.feeMinor += p.allocations.filter((a) => a.role === 'acquirer_fee').reduce((s, a) => s + a.amountMinor, 0);
    others.set(p.instrument, e);
  }
  const instrumentWord: Record<string, [string, string]> = { pay_by_bank: ['Pay by bank', 'Оплата з банку'], qr_nbu: ['NBU QR', 'QR НБУ'], bank_transfer: ['Bank transfer', 'Банківський переказ'], installments: ['Instalments', 'Оплата частинами'], bonus_points: ['Bonus points', 'Бонусні бали'] };

  const proposals = w.insights.filter((i) => i.agent === 'router' && i.status === 'open').slice(0, 2);
  const navigator = pickText(agentCatalogue.find((a) => a.id === 'router')!.name, locale);

  return (
    <ArticleFrame locale={locale} slug="routing" sheet="RP-01" title={t('Routing and the cost of acceptance', 'Маршрутизація і собівартість приймання платежів')}
      lead={t('A group that accepts cards through several banks pays each of them under its own agreement, so the same payment costs different amounts depending on which bank carries it. Routing is the decision, taken for every online payment, of which acquirer carries it — by approval and by cost, within limits the group sets. This article explains what the cost consists of, what on-us means, how the decision is made and recorded, and where routing does not reach.', 'Група, що приймає картки через кілька банків, платить кожному за власним договором, тож той самий платіж коштує по-різному залежно від того, який банк його проводить. Маршрутизація — це рішення, яке ухвалюється для кожного онлайн-платежу: який еквайр його проведе, з огляду на схвалення й вартість і в межах, які задає група. Стаття пояснює, з чого складається вартість, що таке on-us, як ухвалюється й записується рішення і куди маршрутизація не дістає.')}
      cta={{ label: t('Open the routing cabinet', 'Відкрити кабінет маршрутизації'), path: '/demo' }}>

      <Section index="1" title={t('What a card payment costs', 'З чого складається вартість карткового платежу')}>
        <p>{t('The fee a merchant pays for a card payment has three parts. Interchange goes to the bank that issued the card. Scheme fees go to the payment system — Visa, Mastercard or ПРОСТІР. The markup is the acquirer’s own margin. For domestic consumer cards in Ukraine, interchange is capped at 1.2 % (since November 2021); corporate and foreign cards are outside the cap.', 'Комісія, яку мерчант сплачує за картковий платіж, має три частини. Interchange (міжбанківська комісія) отримує банк, що випустив картку. Збори платіжної системи — Visa, Mastercard чи ПРОСТІР. Маржа еквайра — його власна частка. Для українських споживчих карток у внутрішніх операціях interchange обмежено 1,2 % (з листопада 2021 року); корпоративні й іноземні картки під обмеження не підпадають.')}</p>
        <p>{t('Agreements present these parts in two ways. A blended rate is one percentage for every card: the parts are inside it and cannot be seen. Interchange++ (IC++) passes interchange and scheme fees through at cost and adds the acquirer’s agreed markup, so the price follows the card. The demo group has both kinds with its three card acquirers, each with an on-us rate:', 'Договори подають ці частини двома способами. Єдина ставка (blended) — один відсоток для будь-якої картки: частини всередині, їх не видно. Interchange++ (IC++) передає interchange і збори систем за собівартістю та додає погоджену маржу еквайра, тож ціна залежить від картки. Демо-група має обидва види договорів зі своїми трьома еквайрами, у кожному — ставка on-us:')}</p>
        <div className="not-prose overflow-x-auto border border-graphite/20">
          <table className="w-full min-w-[560px] text-left text-[0.84rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Acquirer', 'Еквайр'), t('Model', 'Модель'), t('Rate or markup', 'Ставка чи маржа'), t('On-us rate', 'Ставка on-us')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{cardAcquirers.map((a) => { const x = online(a.id); return x ? <tr key={a.id} className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-900">{acquirerName(a.id)}</td><td className="px-3 py-2">{pickText(acquiringModelLabels[x.model], locale)}</td><td className="px-3 py-2 tabular-nums">{x.model === 'blended' ? percent(x.blendedBps ?? 0, locale, 2) : `IC + ${t('schemes', 'системи')} + ${percent(x.markupBps ?? 0, locale, 2)}`}</td><td className="px-3 py-2 tabular-nums">{x.onUsBps !== null ? percent(x.onUsBps, locale, 2) : '—'}</td></tr> : null; })}</tbody>
          </table>
        </div>
        <p>{t('What one payment of 1,000 hryvnias costs at each of them, for different cards (the interchange figures are the demo’s assumptions under the cap, not published rates):', 'Скільки коштує один платіж на 1 000 гривень у кожного з них для різних карток (значення interchange — припущення демо в межах обмеження, а не опубліковані ставки):')}</p>
        <Figure caption={t('Fig. 1.1 — the cost of a 1,000-hryvnia payment by card and acquirer. Shaded: the card’s own bank, priced at the on-us rate.', 'Рис. 1.1 — вартість платежу на 1 000 гривень за карткою та еквайром. Тоном: власний банк картки, ставка on-us.')}>
          <table className="w-full min-w-[640px] text-left text-[0.84rem]">
            <thead><tr className="border-b border-ink-900/80"><th className={th}>{t('Card', 'Картка')}</th>{cardAcquirers.map((a) => <th key={a.id} className={`${th} text-right`}>{acquirerName(a.id)}</th>)}</tr></thead>
            <tbody>{examples.map((e) => (
              <tr key={`${e.issuer}${e.product}`} className="border-b border-graphite/15">
                <td className="px-3 py-2 text-ink-900">{t(e.en, e.uk)}</td>
                {cardAcquirers.map((a) => {
                  const terms = online(a.id);
                  if (!terms) return <td key={a.id} className="px-3 py-2 text-right text-ink-300">—</td>;
                  const { onUs, cost: c } = costAt(terms, e.issuer, e.product, e.scheme);
                  const parts = c.model === 'ic_plus_plus' ? `${money(c.interchangeMinor ?? 0, 'UAH', locale)} + ${money(c.schemeMinor ?? 0, 'UAH', locale)} + ${money(c.markupMinor ?? 0, 'UAH', locale)}` : c.model === 'on_us' ? t('on-us rate', 'ставка on-us') : t('blended rate', 'єдина ставка');
                  return <td key={a.id} className={`px-3 py-2 text-right ${onUs ? 'bg-teal-100' : ''}`}><span className="font-semibold tabular-nums text-ink-900">{money(c.totalMinor, 'UAH', locale)}</span><span className="annot block text-[0.55rem] text-ink-500">{parts}</span></td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </Figure>
        <p>{t('Under IC++ the parts are shown as interchange + scheme fee + markup. The spread in each row is what routing works with.', 'За IC++ частини показано як interchange + збір системи + маржа. Різниця в кожному рядку — те, з чим працює маршрутизація.')}</p>
      </Section>

      <Section index="2" title={t('On-us', 'On-us')}>
        <p>{t('A payment is on-us when the card was issued by the same bank that acquires it. The bank is then on both sides of the payment: no interchange passes to another bank, and its own cost is lower. Whether the merchant sees that difference depends on the agreement. Under a blended rate without an on-us clause the bank keeps it. An on-us clause prices such payments separately — in the demo group’s agreements at 0.55–0.60 % instead of about 1 %.', 'Платіж є on-us, коли картку випустив той самий банк, що її приймає. Тоді банк стоїть по обидва боки платежу: interchange іншому банку не передається, і його власна собівартість нижча. Чи побачить цю різницю мерчант, залежить від договору. За єдиної ставки без умови on-us різницю залишає собі банк. Умова on-us визначає для таких платежів окрему ціну — у договорах демо-групи 0,55–0,60 % замість приблизно 1 %.')}</p>
        <Figure caption={t('Fig. 1.2 — one card payment of Bank Dnipro and its route, live: the group’s terms at each acquirer, and the decision of the platform’s routing function under the current strategy and threshold.', 'Рис. 1.2 — один платіж карткою Банку Дніпро та його маршрут, наживо: умови групи в кожного еквайра й рішення функції маршрутизації платформи за чинними стратегією та порогом.')}>
          <OnUsFigure w={w} locale={locale} />
        </Figure>
        <p>{t('To route on-us, the platform must know the issuing bank before it chooses the acquirer. It reads it from the first digits of the card number (the BIN) in a directory of issuers. In this demo the card number never leaves the payer’s browser: the server receives only the BIN and the last four digits. In a live deployment the way the full number reaches the chosen acquirer is a PCI DSS matter — the platform’s own payment fields, a neutral token vault or network tokens — and is settled before a pilot.', 'Щоб маршрутизувати on-us, платформа має знати банк-емітент ще до вибору еквайра. Вона визначає його за першими цифрами номера картки (BIN) у довіднику емітентів. У цьому демо номер картки не залишає браузер платника: на сервер надходять лише BIN і чотири останні цифри. У робочому розгортанні шлях повного номера до обраного еквайра — питання PCI DSS (власні платіжні поля, нейтральне сховище токенів чи мережеві токени); його вирішують до пілоту.')}</p>
        <p>{t(`How often on-us is possible depends on whose cards the payers carry. Of the group’s ${count(cardSessions.length, locale)} online card payments in the last 30 days, ${percent(ownShare, locale)} were cards of the three banks it has agreements with:`, `Наскільки часто on-us можливий, залежить від того, чиї картки мають платники. Із ${count(cardSessions.length, locale)} онлайн-платежів картками групи за останні 30 днів ${percent(ownShare, locale)} — картки трьох банків, з якими в неї є договори:`)}</p>
        <ul>{mixRows.map(([issuer, n]) => <li key={issuer ?? '-'}>{bankName(issuer)}: <b>{percent(Math.round((n / cardSessions.length) * 10_000), locale)}</b>{issuer && (issuers.find((i) => i.id === issuer)?.acquirerIds ?? []).some((a) => w.providers.includes(a)) ? <span className="text-ink-500"> · {t('on-us possible', 'on-us можливий')}</span> : null}</li>)}</ul>
      </Section>

      <Section index="3" title={t('The routing decision', 'Рішення маршрутизації')}>
        <p>{t('For every online card payment the platform quotes each acquirer the group has an agreement with — the expected fee for this card under that agreement — and applies the group’s strategy:', 'Для кожного онлайн-платежу карткою платформа розраховує очікувану комісію кожного еквайра, з яким у групи є договір, — за умовами цього договору для цієї картки — і застосовує стратегію групи:')}</p>
        <ul>{Object.keys(strategyWord).map((s) => <li key={s}><b>{sw(s)}</b> — {t(strategyWord[s]![2], strategyWord[s]![3])}</li>)}</ul>
        <p>{t(`An acquirer whose approval rate is below the group’s threshold — ${percent(minApproval, locale, 0)} now — is never chosen to save on fees. A declined payment can cost the sale, while the difference in fees is a fraction of a per cent; the threshold keeps cost optimisation from lowering approval. If no acquirer qualifies, approval first decides.`, `Еквайра, чий рівень схвалення нижчий за поріг групи — зараз ${percent(minApproval, locale, 0)}, — ніколи не обирають заради меншої комісії. Відхилений платіж може коштувати продажу, а різниця в комісіях — частки відсотка; поріг не дає оптимізації вартості знизити схвалення. Якщо жоден еквайр не проходить поріг, рішення ухвалюється за схваленням.`)}</p>
        <p>{t('The decision is recorded as an event of the payment session together with every acquirer considered: its expected fee, its approval rate, whether the card is on-us for it and whether it qualified. Any payment can be explained afterwards, and the same records make a replay possible. A real decision of the demo:', 'Рішення записується як подія платіжної сесії разом з усіма еквайрами, яких розглянули: очікувана комісія, рівень схвалення, чи є картка для нього on-us і чи пройшов він поріг. Будь-який платіж можна пояснити згодом, і ті самі записи дають змогу відтворити рішення. Справжнє рішення демо:')}</p>
        {decided && alternatives.length > 0 ? (
          <Figure caption={`${t('Fig. 1.3 — the routing decision of session', 'Рис. 1.3 — рішення маршрутизації сесії')} ${decided.sessionId} · ${bankName(decided.route!.issuer)} · ${money(decided.amountMinor, decided.currency, locale)}`}>
            <table className="w-full min-w-[560px] text-left text-[0.84rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Acquirer', 'Еквайр'), t('Expected fee', 'Очікувана комісія'), t('Approval', 'Схвалення'), t('On-us', 'On-us'), t('Qualifies', 'Проходить поріг')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>{alternatives.map((a) => <tr key={a.acquirer} className={`border-b border-graphite/15 ${a.acquirer === decided.route!.acquirer ? 'bg-sunrise-100' : ''}`}><td className="px-3 py-2 text-ink-900">{acquirerName(a.acquirer)}{a.acquirer === decided.route!.acquirer ? <span className="annot ml-2 text-[0.55rem] text-sunrise-600">{t('chosen', 'обрано')}</span> : null}</td><td className="px-3 py-2 tabular-nums">{a.feeMinor !== null ? money(a.feeMinor, decided.currency, locale) : '—'}</td><td className="px-3 py-2 tabular-nums">{percent(a.approvalBps, locale)}</td><td className="px-3 py-2">{a.onUs ? t('yes', 'так') : '—'}</td><td className="px-3 py-2">{a.eligible ? t('yes', 'так') : t('no', 'ні')}</td></tr>)}</tbody>
            </table>
          </Figure>
        ) : null}
      </Section>

      {change && change.value !== 'approval_first' ? (
        <Section index="4" title={t('What a change of strategy did', 'Що змінила зміна стратегії')}>
          <p>{t(`Until ${day(change.setAt, locale)} the demo group routed by approval first. The ${navigator} agent replayed the previous weeks under the other strategies and proposed “${sw(String(change.value))}”; ${changedBy}, the payments manager, accepted it. Week by week, the on-us share and the effective rate — the expected fee divided by the volume — of the group’s online card payments:`, `До ${day(change.setAt, locale)} демо-група маршрутизувала за схваленням. Агент «${navigator}» відтворив попередні тижні за іншими стратегіями й запропонував «${sw(String(change.value))}»; ${changedBy}, менеджер платежів, прийняв пропозицію. Тиждень за тижнем — частка on-us і ефективна ставка (очікувана комісія, поділена на обсяг) онлайн-платежів картками групи:`)}</p>
          <div className="not-prose grid gap-4 lg:grid-cols-2">
            <Figure caption={t('Fig. 1.4 — on-us share of online card payments, by week', 'Рис. 1.4 — частка on-us серед онлайн-платежів картками, за тижнями')}><LineChart series={[{ label: t('On-us share', 'Частка on-us'), tone: 'teal', points: weeks.map((x) => ({ day: x.week, value: x.onUsBps })) }]} format={(v) => percent(v, locale, 0)} dayLabel={dayLabel} height={180} /></Figure>
            <Figure caption={t('Fig. 1.5 — effective rate of online card payments, by week', 'Рис. 1.5 — ефективна ставка онлайн-платежів картками, за тижнями')}><LineChart series={[{ label: t('Effective rate', 'Ефективна ставка'), tone: 'river', points: weeks.map((x) => ({ day: x.week, value: x.rateBps })) }]} format={(v) => percent(v, locale, 2)} dayLabel={dayLabel} height={180} /></Figure>
          </div>
          <p>{t(`Before the change the on-us share averaged ${percent(avg(before, 'onUsBps'), locale, 0)} and the effective rate ${percent(avg(before, 'rateBps'), locale, 2)}; after it, ${percent(avg(after, 'onUsBps'), locale, 0)} and ${percent(avg(after, 'rateBps'), locale, 2)}. Over the last 30 days the group paid ${money(cost.feeMinor, 'UAH', locale)} on ${money(cost.grossMinor, 'UAH', locale)} of online card payments.`, `До зміни частка on-us у середньому становила ${percent(avg(before, 'onUsBps'), locale, 0)}, ефективна ставка — ${percent(avg(before, 'rateBps'), locale, 2)}; після — ${percent(avg(after, 'onUsBps'), locale, 0)} і ${percent(avg(after, 'rateBps'), locale, 2)}. За останні 30 днів група сплатила ${money(cost.feeMinor, 'UAH', locale)} з ${money(cost.grossMinor, 'UAH', locale)} онлайн-платежів картками.`)}</p>
          <p>{t('A replay answers the question “what if”: the same sessions go through the same routing function under another policy, on the same quotes. Here is the last 30 days under each strategy, at the current threshold:', 'Відтворення відповідає на запитання «а що, якби»: ті самі сесії проходять ту саму функцію маршрутизації за іншою політикою, з тими самими розрахунками комісій. Ось останні 30 днів за кожною стратегією при чинному порозі:')}</p>
          <div className="not-prose overflow-x-auto border border-graphite/20">
            <table className="w-full min-w-[560px] text-left text-[0.84rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Strategy', 'Стратегія'), t('Fees', 'Комісії'), t('On-us share', 'Частка on-us'), t('Change in approval', 'Зміна схвалення')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                <tr className="border-b border-graphite/15 bg-paper-deep"><td className="px-3 py-2 text-ink-900">{t('As routed', 'Як було насправді')}</td><td className="px-3 py-2 tabular-nums">{money(sim.actualFeeMinor, sim.currency, locale)}</td><td className="px-3 py-2 tabular-nums">{percent(sim.actualOnUsShareBps, locale, 0)}</td><td className="px-3 py-2">—</td></tr>
                {sim.simulated.map((s) => <tr key={s.strategy} className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-900">{sw(s.strategy)}</td><td className="px-3 py-2 tabular-nums">{money(s.feeMinor, sim.currency, locale)}</td><td className="px-3 py-2 tabular-nums">{percent(s.onUsShareBps, locale, 0)}</td><td className="px-3 py-2 tabular-nums">{s.approvalDeltaBps === 0 ? '0' : `${s.approvalDeltaBps > 0 ? '+' : '−'}${percent(Math.abs(s.approvalDeltaBps), locale, 2)}`}</td></tr>)}
              </tbody>
            </table>
          </div>
          {sim.blockedOnUs.length > 0 ? <p>{t('The threshold also keeps some on-us payments away:', 'Поріг також не пропускає частину платежів on-us:')} {sim.blockedOnUs.map((b) => t(`${pickText(b.bankName, locale)}’s cards could go on-us at ${pickText(b.acquirerName, locale)}, but its approval rate is ${percent(b.approvalBps, locale, 0)} — ${count(b.sessions, locale)} payments and ${money(b.savingMinor, sim.currency, locale)} in 30 days. The ${navigator} agent proposes to raise this with the bank rather than lower the threshold.`, `картки банку «${pickText(b.bankName, locale)}» могли б іти on-us через «${pickText(b.acquirerName, locale)}», але його рівень схвалення — ${percent(b.approvalBps, locale, 0)}: ${count(b.sessions, locale)} платежів і ${money(b.savingMinor, sim.currency, locale)} за 30 днів. «${navigator}» пропонує обговорити це з банком, а не знижувати поріг.`)).join(' ')}</p> : null}
          <p>{t('The demo’s online volume is small, so the sums are small; the rates are what carries over. For scale: every 0.1 percentage point on 10 billion hryvnias of card turnover a year is 10 million hryvnias.', 'Онлайн-обсяг демо невеликий, тому й суми невеликі; переносяться ставки. Для масштабу: кожні 0,1 відсоткового пункту на 10 млрд гривень карткового обороту на рік — це 10 млн гривень.')}</p>
        </Section>
      ) : null}

      {pos.length > 0 ? (
        <Section index="5" title={t('What routing does not reach: the tills', 'Чого маршрутизація не охоплює: каси')}>
          <p>{t('Payments at the tills go through the terminals of the bank each region works with; the platform does not carry them and does not route them. The banks’ settlement reports still reach it, and with them the issuing bank and product of every card. That shows, region by region, how much of the turnover is the terminal bank’s own cards and what an on-us clause or another terminal bank would cost:', 'Платежі на касах проходять через термінали банку, з яким працює регіон; платформа їх не проводить і не маршрутизує. Проте звіти банків про розрахунки до неї надходять, а з ними — банк-емітент і тип кожної картки. Це показує, регіон за регіоном, яку частку обороту становлять власні картки банку терміналів і скільки коштували б умова on-us чи інший банк терміналів:')}</p>
          <div className="not-prose overflow-x-auto border border-graphite/20">
            <table className="w-full min-w-[720px] text-left text-[0.84rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Region', 'Регіон'), t('Terminal bank', 'Банк терміналів'), t('Card turnover, 30 days', 'Картковий оборот, 30 днів'), t('Fee · rate', 'Комісія · ставка'), t('Its own cards', 'Його власні картки'), t('With an on-us clause', 'З умовою on-us'), t('Cheapest other bank', 'Найдешевший інший банк')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>{pos.map((p) => { const best = p.alternatives.filter((x) => x.acquirer !== p.acquirer).sort((a, b) => a.feeMinor - b.feeMinor)[0]; return (
                <tr key={p.regionId} className="border-b border-graphite/15">
                  <td className="px-3 py-2 text-ink-900">{regionName(p.regionId)}</td>
                  <td className="px-3 py-2">{pickText(p.acquirerName, locale)}</td>
                  <td className="px-3 py-2 tabular-nums">{money(p.volumeMinor, 'UAH', locale, true)}</td>
                  <td className="px-3 py-2 tabular-nums">{money(p.feeMinor, 'UAH', locale, true)} · {percent(Math.round((p.feeMinor / p.volumeMinor) * 10_000), locale, 2)}</td>
                  <td className="px-3 py-2 tabular-nums">{percent(p.ownBankShareBps, locale, 0)}</td>
                  <td className="px-3 py-2 tabular-nums">{p.onUsClause ? t('in the agreement', 'є в договорі') : p.ifOnUsClauseFeeMinor !== null ? `${money(p.ifOnUsClauseFeeMinor, 'UAH', locale, true)} (−${money(p.feeMinor - p.ifOnUsClauseFeeMinor, 'UAH', locale, true)})` : '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{best ? `${pickText(best.acquirerName, locale)} · ${money(best.feeMinor, 'UAH', locale, true)}` : '—'}</td>
                </tr>
              ); })}</tbody>
            </table>
          </div>
          <p>{t(`The four regions took ${money(tillVolume, 'UAH', locale, true)} by card at the tills in 30 days — far more than online. This is where the larger sums are, and the work is commercial: an on-us clause in a terminal agreement, IC++ instead of a blended rate, or a different terminal bank for a region. The platform supplies the figures for the negotiation and then checks every settlement against what was agreed.`, `Чотири регіони за 30 днів прийняли на касах ${money(tillVolume, 'UAH', locale, true)} картками — значно більше, ніж онлайн. Саме тут більші суми, і робота тут комерційна: умова on-us у договорі на термінали, IC++ замість єдиної ставки чи інший банк терміналів для регіону. Платформа дає цифри для переговорів, а потім звіряє кожен розрахунок із домовленим.`)}</p>
        </Section>
      ) : null}

      <Section index="6" title={t('Beyond cards', 'Поза картками')}>
        <p>{t('Instant credit transfers in the National Bank’s SEP (since December 2024: within ten seconds, up to 100,000 hryvnias) and account-to-account payments carry no interchange: the cost is a fixed fee per transfer. A QR code or a pay link lets a payer use them on the site, in the app and at delivery. Pay by bank through open banking adds another such route as banks open their interfaces under the National Bank’s rules. Instalments cost more than a card and are offered where they raise the basket; bonus points are paid through the group’s own bonus system and cost nothing to accept.', 'Миттєві кредитові перекази в СЕП Національного банку (з грудня 2024 року: до десяти секунд, до 100 000 гривень) і платежі з рахунку на рахунок не мають interchange: вартість — фіксована плата за переказ. QR-код чи платіжне посилання дають змогу скористатися ними на сайті, у застосунку й під час доставки. Оплата з банку через відкритий банкінг додасть ще один такий шлях, коли банки відкриють свої інтерфейси за правилами Національного банку. Оплата частинами дорожча за картку, її пропонують там, де вона збільшує кошик; бонусні бали проходять через власну бонусну систему групи, і їх приймання нічого не коштує.')}</p>
        {others.size > 0 ? <ul>{[...others.entries()].sort((a, b) => b[1].count - a[1].count).map(([id, x]) => <li key={id}>{t(instrumentWord[id]?.[0] ?? id, instrumentWord[id]?.[1] ?? id)}: <b>{count(x.count, locale)}</b> {t('payments', 'платежів')}, {money(x.grossMinor, 'UAH', locale, true)} · {t('cost', 'вартість')} {money(x.feeMinor, 'UAH', locale)}{x.grossMinor > 0 ? ` (${percent(Math.round((x.feeMinor / x.grossMinor) * 10_000), locale, 2)})` : ''}</li>)}</ul> : null}
      </Section>

      <Section index="7" title={t('Who decides', 'Хто ухвалює рішення')}>
        <p>{t(`The strategy, the threshold and each region’s terminal bank are policies of the group, set by the payments manager and recorded with who changed them and when. The ${navigator} agent watches the decisions and the banks’ reports and proposes changes with a replay attached; a person accepts or declines. Commercial questions — an on-us clause, IC++ instead of a blended rate, a bank’s approval rate — are proposed with the figures for the conversation with the bank. Open proposals on the stand now:`, `Стратегія, поріг і банк терміналів кожного регіону — політики групи, їх задає менеджер платежів, і кожну зміну записано з автором і часом. Агент «${navigator}» стежить за рішеннями та звітами банків і пропонує зміни разом із відтворенням; людина приймає чи відхиляє. Комерційні питання — умова on-us, IC++ замість єдиної ставки, рівень схвалення банку — пропонуються з цифрами для розмови з банком. Відкриті пропозиції на стенді зараз:`)}</p>
        <div className="not-prose grid gap-3">{proposals.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={(p) => href(locale, `/cabinet${p}`)} back={href(locale, '/platform/routing')} canDecide={false} personName={(id) => pickText(w.people.find((p) => p.id === id)?.name, locale) || id} />)}</div>
      </Section>
    </ArticleFrame>
  );
}
