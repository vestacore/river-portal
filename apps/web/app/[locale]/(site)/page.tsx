import Link from 'next/link';
import { pickText } from '@river/i18n';
import { roleLabels } from '@river/psp-access';
import { agentCatalogue } from '@river/psp-agents';
import { stageCatalogue, stages } from '@river/psp-facts';
import { instrumentCatalogue } from '@river/psp-instruments';
import { demoPersonas } from '@river/psp-runtime';
import { BasinDrawing, type BasinMark } from '@/components/river/BasinDrawing';
import { DeltaDrawing, type DeltaStream } from '@/components/river/DeltaDrawing';
import { PaymentRiver, type RiverStream } from '@/components/river/PaymentRiver';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { capturedSince, eurInUah, formsOfStage, roleShares, sinceDays, splitExample, stageCounts, subtreeFlows } from '@/lib/figures';
import { count, money, percent } from '@/lib/format';
import { href } from '@/lib/href';
import { instrumentIcon } from '@/lib/instrumentIcon';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { treeLayout } from '@/lib/treeLayout';
import { isWithin } from '@river/psp-units';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

/**
 * The home of River Pay: information for business, drawn as the river it describes. Every figure on it
 * is live — read from the demo stand's own streams — so the page is also the first view of the demo.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const w = world();
  const from = sinceDays(30);
  const counts = stageCounts(w, from);
  const shares = roleShares(w, from, 'UAH');
  const paid = capturedSince(w, from);
  const uah = paid.filter((p) => p.currency === 'UAH').reduce((s, p) => s + p.capturedMinor, 0);
  const eur = paid.filter((p) => p.currency === 'EUR').reduce((s, p) => s + p.capturedMinor, 0);
  const sessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from);
  const secured = sessions.filter((s) => s.paymentId !== null).length;
  const refused = sessions.filter((s) => s.paymentId === null && s.outcome === 'failed').length;
  const openProposals = w.insights.filter((i) => i.status === 'open').length;

  const riverStages = stages.slice(1, 8).map((stage) => ({ label: pickText(stageCatalogue.find((s) => s.stage === stage)!.label, locale), forms: formsOfStage(stage), count: count(counts[stage], locale) }));
  const streamOf = (label: string, minor: number, tone: RiverStream['tone']): RiverStream => ({ label, share: minor, amount: money(minor, 'UAH', locale, true), tone });
  const riverStreams = [
    streamOf(t('Sellers', 'Продавці'), shares.seller, 'seller'),
    streamOf(t('Merchants', 'Мерчанти'), shares.merchant + shares.platform + shares.reserve, 'merchant'),
    streamOf(t('Franchisors', 'Франчайзери'), shares.partner, 'platform'),
    streamOf(t('Good causes', 'Добрі справи'), shares.charity, 'charity'),
    streamOf(t('PSP fee', 'Комісія PSP'), shares.psp_fee, 'fee'),
  ];

  const example = splitExample(w);
  const unitName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale);
  const roleName: Record<string, string> = { seller: t('seller · its lines less 8 %', 'продавець · свої позиції мінус 8 %'), platform: t('marketplace · the remainder', 'маркетплейс · залишок'), charity: t('good cause · 1 % of the payment', 'добра справа · 1 % платежу'), psp_fee: t('payment service fee · from the tariff', 'комісія платіжного сервісу · за тарифом'), merchant: t('merchant · the remainder', 'мерчант · залишок'), reserve: t('rolling reserve', 'ковзний резерв'), partner: t('franchisor · royalty', 'франчайзер · роялті') };
  const toneOf = (role: string): DeltaStream['tone'] => (role === 'seller' ? 'seller' : role === 'charity' ? 'charity' : role === 'psp_fee' ? 'fee' : role === 'reserve' ? 'reserve' : role === 'platform' ? 'platform' : 'merchant');

  const flows = subtreeFlows(w, from);
  const tree = treeLayout(w.units, 'ou-riverpay', (u) => u.kind !== 'store' && u.kind !== 'seller', 1400, 92);
  const treeHeight = 40 + Math.max(...tree.map((n) => n.depth)) * 92 + 84;
  const flowLabel = (unitId: string) => {
    const byCurrency = new Map<string, number>();
    for (const p of paid) if (isWithin(w.units, p.unitId, unitId)) byCurrency.set(p.currency, (byCurrency.get(p.currency) ?? 0) + p.capturedMinor);
    return [...byCurrency.entries()].map(([c, v]) => money(v, c, locale, true)).join(' · ') || '—';
  };
  const shortName = (name: string) => (name.length > 18 ? `${name.slice(0, 17)}…` : name);
  const marks: Record<string, BasinMark> = Object.fromEntries(w.units.map((u) => [u.id, {
    unitId: u.id, flow: flows[u.id] ?? 0, enforced: w.settings.filter((s) => s.unitId === u.id && s.mode === 'enforced').length, set: w.settings.filter((s) => s.unitId === u.id).length,
    blocked: u.blockInheritance, onboarding: u.status === 'onboarding', label: shortName(pickText(u.name, locale).replace(/^River Pay /, '').replace(/^(Zerno|Зерно) /, '')), sub: flowLabel(u.id),
  }]));

  const byInstrument = new Map(instrumentCatalogue.map((i) => [i.id, 0]));
  for (const p of paid) byInstrument.set(p.instrument, (byInstrument.get(p.instrument) ?? 0) + 1);

  const features = [
    { icon: 'split', path: '/platform/split', title: t('One order, many streams', 'Одне замовлення — багато протоків'), text: t('Sellers, the marketplace, a good cause and the fee each receive their share at the capture, by rules the hierarchy sets — and the shares always sum to the amount.', 'Продавці, маркетплейс, добра справа й комісія отримують свої частки в момент списання — за правилами, які задає ієрархія, і частки завжди сходяться до суми.') },
    { icon: 'tree', path: '/platform/hierarchy', title: t('Rules flow down, flows rise up', 'Правила течуть донизу, потоки — догори'), text: t('As in a directory: a holding sets limits, instruments and the pay page for every shop below it, enforces what must not change, and sees every payment of its subtree.', 'Як у каталозі: холдинг задає ліміти, інструменти й сторінку оплати для всіх точок нижче, закріплює те, що не можна змінювати, і бачить кожен платіж свого піддерева.') },
    { icon: 'layers', path: '/platform/instruments', title: t('Every instrument is first-class', 'Кожен інструмент — рівноправний'), text: t('Cards, wallets, pay by bank, transfers, NBU QR, instalments, pay later, e-wallets, stablecoins, cash at a kiosk, direct debit: each has its own bridges, all share one river.', 'Картки, гаманці, оплата з банку, перекази, QR НБУ, оплата частинами й пізніше, е-гаманці, стейблкоїни, готівка в терміналі, пряме списання: у кожного свої мости, у всіх — одна ріка.') },
    { icon: 'bridge', path: '/platform/lifecycle', title: t('The whole life, its projections in view', 'Увесь цикл — з проєкціями на виду'), text: t('From the source to the mouth and beyond — refunds, disputes, payouts — every bridge shows what it changed in the order, the invoice, the payment and the ledger.', 'Від витоку до гирла й далі — повернення, спори, виплати — кожен міст показує, що він змінив у замовленні, інвойсі, платежі та обліку.') },
    { icon: 'bot', path: '/platform/agents', title: t('A swarm that watches, people who decide', 'Рій, що стежить, і люди, що вирішують'), text: t('Eight agents read the projections — fraud, routing, reconciliation, collections, AML, disputes, integration, treasury — and propose. A person decides; the policy says what is safe to do alone.', 'Вісім агентів читають проєкції — шахрайство, маршрути, звірка, стягнення, AML, спори, інтеграція, казначейство — і пропонують. Вирішує людина; політика визначає, що безпечно робити самостійно.') },
    { icon: 'invoice', path: '/platform/invoicing', title: t('Invoices, orders and tracking, built in', 'Інвойси, замовлення й відстеження — вбудовані'), text: t('Issue an invoice with a pay link, follow its views and attempts, remind on schedule, ship and track the goods: the order is a boundary of its own.', 'Виставте інвойс із посиланням на оплату, стежте за переглядами й спробами, нагадуйте за розкладом, відвантажуйте й відстежуйте товар: замовлення — окрема межа системи.') },
  ];

  const tiles: Array<[string, string]> = [
    [t('Captured, 30 days', 'Списано за 30 днів'), `${money(uah, 'UAH', locale, true)} · ${money(eur, 'EUR', locale, true)}`],
    [t('Payments', 'Платежів'), count(paid.length, locale)],
    [t('Approved', 'Схвалено'), percent(secured + refused ? Math.round((secured / (secured + refused)) * 10_000) : 0, locale)],
    [t('Instruments at work', 'Інструментів у роботі'), String([...byInstrument.values()].filter((n) => n > 0).length)],
    [t('Units in the hierarchy', 'Одиниць в ієрархії'), String(w.units.length)],
    [t('Agent proposals waiting', 'Пропозицій агентів чекають'), String(openProposals)],
  ];

  return (
    <>
      <section className="paper-grid relative overflow-hidden border-b border-graphite/15 pb-14 pt-12 sm:pt-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
            <div className="animate-rise">
              <p className="annot mb-7 flex items-center gap-3 text-ink-500"><span className="text-sunrise-600">{t('Payment platform', 'Платіжна платформа')} · {t('demo stand', 'демо-стенд')}</span><span className="h-px w-16 bg-graphite/40" aria-hidden="true" /></p>
              <h1 className="text-balance text-[2.7rem] font-semibold leading-[1.03] tracking-[-0.03em] text-ink-900 sm:text-6xl">{t('Every payment is a river.', 'Кожен платіж — це ріка.')}</h1>
              <p className="mt-6 max-w-2xl text-lg text-ink-700 sm:text-xl">{t('River Pay carries each attempt to pay from unpaid to paid across bridges you can see. Every bridge is an event that forms the same views of the order, the invoice and the payment. At the mouth the money splits into as many streams as your business has.', 'River Pay проводить кожну спробу оплати від несплаченого до сплаченого через мости, які видно. Кожен міст — подія, що формує ті самі проєкції замовлення, інвойсу й платежу. У гирлі гроші розходяться на стільки протоків, скільки їх має ваш бізнес.')}</p>
            </div>
            <div className="animate-rise lg:pb-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <Button href={href(locale, '/demo')} size="lg"><Icon name="layers" />{t('Try a cabinet', 'Спробувати кабінет')}</Button>
                <Button href={href(locale, '/shop')} size="lg" variant="secondary"><Icon name="card" />{t('Pay a demo invoice', 'Сплатити демо-інвойс')}</Button>
              </div>
              <ul className="annot mt-7 grid gap-2 text-ink-500">
                {[t('Card data never enters the river', 'Дані карток не потрапляють у потік'), t('Every figure is derived from the log', 'Кожна цифра виведена з журналу'), t('Agents propose, people decide', 'Агенти пропонують, люди вирішують')].map((item) => (
                  <li key={item} className="flex items-center gap-2"><Icon name="check" className="size-3.5 text-teal-600" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <figure className="mt-12">
            <PaymentRiver stages={riverStages} streams={riverStreams}
              source={[t('Source', 'Витік'), t('an unpaid invoice', 'несплачений інвойс')]} mouth={[t('Paid', 'Сплачено'), t('the mouth', 'гирло')]}
              legend={{ session: t('session', 'сесія'), order: t('order', 'замовлення'), invoice: t('invoice', 'інвойс'), payment: t('payment', 'платіж'), ledger: t('ledger', 'облік'), crossed: t('figures under the bridges: attempts that crossed, 30 days', 'числа під мостами: спроби, що перетнули, 30 днів') }} />
            <figcaption className="annot mt-3 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{t('Fig. 1 — one attempt to pay, live: the bridges it crosses, the views each one forms, and how the money of the last 30 days divided at the mouth.', 'Рис. 1 — одна спроба оплати, наживо: мости, які вона перетинає, проєкції, що формує кожен, і як розділилися гроші за останні 30 днів у гирлі.')}</figcaption>
          </figure>
        </Container>
      </section>

      <section className="border-b border-graphite/15 bg-paper-deep">
        <Container>
          <div className="grid grid-cols-2 gap-px bg-graphite/15 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map(([label, value]) => (
              <div key={label} className="bg-paper-deep px-4 py-6">
                <p className="annot text-ink-500">{label}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-ink-900">{value}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading index="01" title={t('What a payment platform shaped like a river does', 'Що вміє платіжна платформа, побудована як ріка')} lead={t('Six things the stand shows in every cabinet. Each has its own article, with figures taken from the demo itself.', 'Шість речей, які стенд показує в кожному кабінеті. Для кожної — своя стаття з цифрами самого демо.')} />
          <ol className="grid gap-px bg-graphite/20 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <li key={f.path} className="bg-paper">
                <Link href={href(locale, f.path)} className="group block h-full p-7 hover:bg-paper-deep">
                  <div className="flex items-center justify-between"><Icon name={f.icon} className="size-7 text-river-700" /><span className="font-mono text-sm text-sunrise-600">{String(i + 1).padStart(2, '0')}</span></div>
                  <h3 className="mt-5 text-xl font-semibold text-ink-900">{f.title}</h3>
                  <p className="mt-3 text-[0.97rem] text-ink-700">{f.text}</p>
                  <p className="annot mt-5 flex items-center gap-2 text-river-700 group-hover:text-ink-900">{t('Read', 'Читати')}<Icon name="arrow" className="size-3.5" /></p>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {example ? (
        <section className="border-t border-graphite/15 py-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <SectionHeading index="02" title={t('One order, many streams', 'Одне замовлення — багато протоків')} lead={t('A real order of the demo marketplace: three sellers, a share for a good cause, the marketplace’s commission and River Pay’s fee. The split is a bridge of the session; the ledger is its projection, so it always balances.', 'Справжнє замовлення демо-маркетплейсу: три продавці, частка на добру справу, комісія маркетплейсу й комісія River Pay. Розщеплення — міст сесії; облік — його проєкція, тому він завжди збалансований.')} />
                <ul className="space-y-2 text-[0.95rem]">
                  {example.order.lines.map((line) => (
                    <li key={line.sku} className="flex justify-between gap-4 border-b border-graphite/20 pb-2"><span className="text-ink-700">{pickText(line.title as never, locale)} <span className="annot text-ink-500">· {line.sellerUnitId ? unitName(line.sellerUnitId) : unitName(example.order.merchantId)}</span></span><span className="tabular-nums text-ink-900">{money(line.totalMinor, example.order.currency, locale)}</span></li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-4"><Button href={href(locale, '/platform/split')} variant="secondary" size="sm">{t('How split works', 'Як працює розщеплення')}<Icon name="arrow" className="size-4" /></Button><Button href={href(locale, '/shop')} variant="ghost" size="sm">{t('Buy something and watch it split', 'Купіть щось і подивіться, як розділиться')}</Button></div>
              </div>
              <figure>
                <DeltaDrawing total={[t('Captured', 'Списано'), money(example.payment.capturedMinor, example.payment.currency, locale)]}
                  streams={example.payment.allocations.map((a) => ({ label: unitName(a.recipientUnitId), role: roleName[a.role] ?? a.role, amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: toneOf(a.role) }))} />
                <figcaption className="annot mt-3 text-ink-500">{t('Fig. 2 — the delta of one payment, to scale. Order', 'Рис. 2 — дельта одного платежу, у масштабі. Замовлення')} {example.order.reference}</figcaption>
              </figure>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-graphite/15 bg-paper-deep py-24">
        <Container>
          <SectionHeading index="03" title={t('Rules flow down, flows rise up', 'Правила течуть донизу, потоки — догори')} lead={t('The hierarchy of the demo, live. The wider the channel, the more money its subtree took in 30 days — every unit sees all of it below. A policy set on a unit applies below it: a lower unit may narrow a limit, never loosen it; take an instrument away, never add one; and nothing may change what is enforced above.', 'Ієрархія демо наживо. Що ширше русло, то більше грошей прийняло його піддерево за 30 днів — кожна одиниця бачить усе, що нижче. Політика одиниці діє донизу: нижча може звузити ліміт, але не розширити; прибрати інструмент, але не додати; і ніхто не змінить того, що закріплено вище.')} />
          <figure className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <BasinDrawing nodes={tree} marks={marks} width={1400} height={treeHeight} legend={{ flows: t('channel width: money of the subtree, 30 days', 'ширина русла: гроші піддерева, 30 днів'), policies: t('policies apply to everything below', 'політики діють на все нижче'), enforced: t('enforces policies', 'закріплює політики'), blocked: t('blocks inheritance', 'блокує успадкування'), onboarding: t('onboarding', 'онбординг') }} />
            </div>
            <figcaption className="annot mt-3 text-ink-500">{t('Fig. 3 — the basin of River Pay. Dashed: merchants still onboarding. EUR flows drawn at a demo rate of', 'Рис. 3 — басейн River Pay. Пунктир: мерчанти на онбордингу. Потоки в EUR накреслено за демо-курсом')} 1 € = {eurInUah} ₴.</figcaption>
          </figure>
          <div className="mt-8"><Button href={href(locale, '/platform/hierarchy')} variant="secondary" size="sm">{t('How the hierarchy works', 'Як працює ієрархія')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index="04" title={t('Twelve instruments, one river', 'Дванадцять інструментів, одна ріка')} lead={t('Each instrument has its own course — a 3-D Secure challenge, a bank’s consent, a scan, a mandate, confirmations on a chain — and the same river from the capture on. Payments of the last 30 days:', 'Кожен інструмент має власне русло — запит 3-D Secure, згода банку, сканування, мандат, підтвердження в мережі — і ту саму ріку від списання далі. Платежі за останні 30 днів:')} />
          <ul className="grid grid-cols-2 gap-px bg-graphite/20 sm:grid-cols-3 lg:grid-cols-6">
            {instrumentCatalogue.map((i) => (
              <li key={i.id} className="bg-paper p-5">
                <Icon name={instrumentIcon(i.id)} className="size-6 text-ink-900" />
                <p className="mt-3 font-semibold text-ink-900">{pickText(i.label, locale)}</p>
                <p className="annot mt-1 text-ink-500">{i.regions.join(' · ')} · {count(byInstrument.get(i.id) ?? 0, locale)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8"><Button href={href(locale, '/platform/instruments')} variant="secondary" size="sm">{t('Each instrument’s course', 'Русло кожного інструменту')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 bg-ink-900 py-24 text-paper">
        <Container>
          <div className="mb-10 max-w-3xl">
            <p className="annot mb-4 flex items-center gap-3 text-paper/60"><span className="text-sunrise-300">§ 05</span><span className="h-px w-12 bg-paper/30" aria-hidden="true" /></p>
            <h2 className="text-3xl font-semibold leading-tight text-paper sm:text-[2.6rem]">{t('A swarm that watches, people who decide', 'Рій, що стежить, і люди, що вирішують')}</h2>
            <p className="mt-4 text-lg text-paper/75">{t('The agents read the same projections the cabinets show — never a stream of money — and write only their own insights. Each proposal carries its evidence; a person accepts or declines it; a unit’s policy says which low-risk proposals may be carried out alone.', 'Агенти читають ті самі проєкції, що й кабінети, — ніколи не потік грошей — і пишуть лише власні висновки. Кожна пропозиція містить докази; людина приймає чи відхиляє її; політика одиниці визначає, які низькоризикові пропозиції можна виконати самостійно.')}</p>
          </div>
          <ul className="grid gap-px bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {agentCatalogue.map((a) => {
              const open = w.insights.filter((i) => i.agent === a.id && i.status === 'open').length;
              return (
                <li key={a.id} className="bg-ink-900 p-6">
                  <div className="flex items-center justify-between"><Icon name={a.glyph} className="size-6 text-sunrise-300" /><span className="annot text-paper/60">{open} {t('open', 'відкрито')}</span></div>
                  <p className="mt-4 text-lg font-semibold">{pickText(a.name, locale)}</p>
                  <p className="mt-2 text-[0.93rem] text-paper/70">{pickText(a.role, locale)}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-8"><Button href={href(locale, '/platform/agents')} size="sm">{t('How the swarm works', 'Як працює рій')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index="06" title={t('Six cabinets, one river', 'Шість кабінетів, одна ріка')} lead={t('Each role sees its part of the same streams, within the units it is granted. Choose a person and work as them — every action goes through the same doors and access checks as in a real deployment.', 'Кожна роль бачить свою частину тих самих потоків — у межах одиниць, до яких має доступ. Оберіть людину й працюйте від її імені — кожна дія проходить ті самі двері й перевірки доступу, що й у справжньому розгортанні.')} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {demoPersonas.map((persona) => {
              const person = w.people.find((p) => p.id === persona.personId)!;
              const grant = w.grants.find((g) => g.personId === persona.personId)!;
              return (
                <li key={persona.personId} className="sketch bg-paper p-6">
                  <p className="annot text-sunrise-600">{pickText(roleLabels[grant.role], locale)}</p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">{pickText(person.name, locale)}</p>
                  <p className="annot mt-1 text-ink-500">{pickText(person.title, locale)}</p>
                  <p className="mt-3 text-[0.95rem] text-ink-700">{pickText(persona.description, locale)}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4"><Button href={href(locale, '/demo')}><Icon name="layers" />{t('Choose a cabinet', 'Обрати кабінет')}</Button><Button href={href(locale, '/developers')} variant="ghost">{t('Read the API', 'Переглянути API')}</Button></div>
        </Container>
      </section>
    </>
  );
}
