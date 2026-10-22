import { pickText, type Locale } from '@river/i18n';
import { boundaries, factCatalogue, projectionLabels, stageCatalogue } from '@river/psp-facts';
import { refundReasonText } from '@river/psp-payment';
import { riverOfSession } from '@river/psp-runtime';
import { stageFunnel } from '@river/psp-views';
import { sinceDays } from '@/lib/figures';
import { count, money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { RiverFunnel } from '../charts/RiverFunnel';
import { BridgeTable } from '../river/BridgeTable';
import { SessionRiver } from '../river/SessionRiver';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

/** Article 03 — the life of a payment: five boundaries, a real session event by event, capture after picking, the stages, after the payment, replay as the check. */
export function LifecycleArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const from = sinceDays(30);
  const sessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from);
  const orders = [...w.views.orders.values()].filter((o) => o.createdAt >= from && o.picked);
  const payments = [...w.views.payments.values()].filter((p) => p.createdAt >= from && p.captureMode === 'manual' && p.capturedAt);
  const example = payments.filter((p) => p.instrument === 'card' && p.capturedMinor < p.amountMinor && w.views.orders.get(p.orderId)?.picked?.changes.length).map((p) => w.views.sessions.get(p.sessionId)).filter((s) => s !== undefined).at(-1);
  const river = example ? riverOfSession(w, example.sessionId) : null;
  const exampleOrder = example ? w.views.orders.get(example.orderId) : undefined;
  const examplePayment = example?.paymentId ? w.views.payments.get(example.paymentId) : undefined;
  const labels = Object.fromEntries(factCatalogue.map((d) => [d.type, pickText(d.label, locale)]));
  const stageLabels = { ...Object.fromEntries(stageCatalogue.map((x) => [x.stage, pickText(x.label, locale)])), after: t('closing', 'завершення') };
  const funnel = stageFunnel(sessions).map((f) => ({ label: pickText(stageCatalogue.find((s) => s.stage === f.stage)!.label, locale), reached: f.reached }));
  const changed = orders.filter((o) => o.picked!.changes.length > 0);
  const kinds = { weight: 0, missing: 0, substitute: 0 };
  for (const o of changed) for (const c of o.picked!.changes) kinds[c.kind] += 1;
  const held = payments.reduce((s, p) => s + p.amountMinor, 0);
  const captured = payments.reduce((s, p) => s + p.capturedMinor, 0);
  const refunds = [...w.views.payments.values()].flatMap((p) => p.refunds).filter((r) => r.status === 'completed' && r.requestedAt >= from);
  const byReason = new Map<string, number>();
  for (const r of refunds) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
  const after = ['dispute.Opened', 'dispute.Won', 'dispute.Lost', 'settlement.Reported', 'settlement.Credited', 'settlement.Resolved'].map((type) => ({ type, n: w.log.filter((f) => f.type === type && f.at >= from).length }));
  const boundaryText: Record<string, [string, string]> = {
    order: ['What is bought, by whom, what was picked, and how its money is distributed.', 'Що купують, хто купує, що скомплектовано і як розподіляються гроші.'],
    invoice: ['The amount to pay: how much, by when, how much is still due.', 'Сума до сплати: скільки, до коли, скільки ще належить.'],
    session: ['One attempt to pay, from unpaid to paid: the river of the drawings.', 'Одна спроба оплати, від несплаченого до сплаченого: ріка на кресленнях.'],
    payment: ['Money secured by an attempt, and its life after: capture, refunds, disputes, settlement.', 'Гроші, забезпечені спробою, і їхнє життя далі: списання, повернення, спори, розрахунок.'],
    settlement: ['What a provider settled for a day, what the group recorded, what the bank credited.', 'Що провайдер розрахував за день, що записала група, що зарахував банк.'],
  };
  return (
    <ArticleFrame locale={locale} slug="lifecycle" sheet="RP-03" title={t('The life of a payment, from order to settlement', 'Життя платежу: від замовлення до розрахунку')}
      lead={t('Five boundaries hold every payment: the order, the invoice, the payment session, the payment and the settlement. Each records only its own events and forms its own view from every event that names it. The drawings show a session as a river from unpaid to paid: each bridge is an event, and the squares under it are the views that event changed.', 'Кожен платіж тримають п’ять меж: замовлення, інвойс, платіжна сесія, платіж і розрахунок. Кожна записує лише власні події й формує свою проєкцію з усіх подій, що її стосуються. На кресленнях сесія показана рікою від несплаченого до сплаченого: кожен міст — подія, а квадрати під ним — проєкції, які ця подія змінила.')}
      cta={{ label: t('Follow a session in the cabinet', 'Простежити сесію в кабінеті'), path: '/demo' }}>
      <Section index="1" title={t('Five boundaries, one vocabulary', 'П’ять меж, один словник')}>
        <p>{t('The boundaries share a vocabulary — every event type, its owner, who may speak it and the views it forms — and nothing else: none of them imports another, and the build checks it. An event is written only into a stream of the boundary that owns it; any boundary may read it. That is the whole contract of a module:', 'Межі мають спільний словник — кожен тип події, його власника, хто може його записати, і проєкції, які він формує, — і більше нічого: жодна не імпортує іншу, і збірка це перевіряє. Подія записується лише в потік межі-власника; прочитати її може будь-яка межа. Це і є весь контракт модуля:')}</p>
        <div className="not-prose overflow-x-auto border border-graphite/20">
          <table className="w-full min-w-[720px] text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Boundary', 'Межа'), t('Holds', 'Тримає'), t('Writes (its own events)', 'Пише (власні події)'), t('Reads from the others', 'Читає від інших')].map((h) => <th key={h} className="annot px-3 py-2 text-[0.56rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
            <tbody>{boundaries.map((b) => (
              <tr key={b} className="border-b border-graphite/15 align-top">
                <td className="px-3 py-2 font-semibold text-ink-900">{pickText(projectionLabels[b], locale)}</td>
                <td className="px-3 py-2 text-ink-700">{t(boundaryText[b]?.[0] ?? b, boundaryText[b]?.[1] ?? b)}</td>
                <td className="px-3 py-2 font-mono text-[0.7rem] text-ink-700">{factCatalogue.filter((d) => d.owner === b).map((d) => d.type).join(' ')}</td>
                <td className="px-3 py-2 font-mono text-[0.7rem] text-ink-500">{factCatalogue.filter((d) => d.owner !== b && d.forms.includes(b)).map((d) => d.type).join(' ')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {river && example ? (
        <Section index="2" title={t('A real online order, event by event', 'Справжнє онлайн-замовлення, подія за подією')}>
          <p>{t('This is a session of the demo group’s online shop as it was written: an order from the order system, a card payment authorised for the estimated basket, then — hours later, after picking — the capture of what was actually picked. The squares under each bridge are the views it formed — session, order, invoice, payment, ledger; the rows below say what changed in each, from what to what.', 'Це сесія інтернет-магазину демо-групи — так, як її записано: замовлення із системи замовлень, авторизація картки на орієнтовний кошик, а через кілька годин, після комплектації, — списання того, що справді скомплектували. Квадрати під кожним мостом — проєкції, які він сформував: сесія, замовлення, інвойс, платіж, облік; рядки нижче показують, що саме змінилося в кожній і з чого на що.')}</p>
          <Figure caption={`${t('Fig. 3.1 — session', 'Рис. 3.1 — сесія')} ${example.sessionId}${exampleOrder ? ` · ${t('order', 'замовлення')} ${exampleOrder.reference}` : ''}`}>
            <SessionRiver bridges={river.bridges} labels={labels} stageLabels={stageLabels} ended="succeeded" legend={{ session: t('session', 'сесія'), order: t('order', 'замовлення'), invoice: t('invoice', 'інвойс'), payment: t('payment', 'платіж'), ledger: t('ledger', 'облік'), door: t('a person or a client system', 'людина чи система клієнта'), figure: t('the platform', 'платформа'), world: t('the outside world: banks, clock', 'зовнішній світ: банки, годинник') }} />
          </Figure>
          <div className="not-prose overflow-x-auto border border-graphite/20"><BridgeTable rows={river.bridges} locale={locale} currency={example.currency} /></div>
        </Section>
      ) : null}

      <Section index="3" title={t('Capture after picking', 'Списання після комплектації')}>
        <p>{t('A grocery basket is not known exactly when it is paid for: weighed goods weigh what they weigh, some items are missing, some are replaced. So the card is authorised for the estimated basket and the money is held; the order system reports what was picked; the invoice is adjusted to the picked amount; the platform captures that amount, less any bonus points, and releases the rest of the hold. A payer whose instrument cannot hold money — a transfer, a QR payment — pays first and receives the difference back as a refund.', 'Продуктовий кошик під час оплати точно не відомий: ваговий товар важить скільки важить, частини позицій немає, частину замінюють. Тому картку авторизують на орієнтовний кошик і кошти блокуються; система замовлень повідомляє, що скомплектовано; інвойс коригується до суми комплектації; платформа списує цю суму за вирахуванням бонусних балів і розблоковує залишок. Платник, чий інструмент не вміє блокувати кошти, — переказ, оплата QR, — платить одразу й отримує різницю поверненням.')}</p>
        <p>{t(`In the last 30 days ${count(orders.length, locale)} online orders were picked; ${count(changed.length, locale)} of them changed in picking (weight ${kinds.weight}, missing ${kinds.missing}, substitutes ${kinds.substitute}). Holds of ${money(held, 'UAH', locale)} became captures of ${money(captured, 'UAH', locale)}: ${percent(held ? Math.round((captured / held) * 10_000) : 0, locale)} of what was held.`, `За останні 30 днів скомплектовано ${count(orders.length, locale)} онлайн-замовлень; ${count(changed.length, locale)} із них змінилися під час комплектації (вага ${kinds.weight}, відсутні ${kinds.missing}, заміни ${kinds.substitute}). Блокування на ${money(held, 'UAH', locale)} стали списаннями на ${money(captured, 'UAH', locale)}: ${percent(held ? Math.round((captured / held) * 10_000) : 0, locale)} від заблокованого.`)}</p>
        {exampleOrder?.picked && examplePayment ? <p>{t(`In the order above: ordered ${money(exampleOrder.totalMinor, 'UAH', locale)}, picked ${money(exampleOrder.picked.totalMinor, 'UAH', locale)}; held ${money(examplePayment.amountMinor, 'UAH', locale)}, captured ${money(examplePayment.capturedMinor, 'UAH', locale)}, released ${money(examplePayment.amountMinor - examplePayment.capturedMinor, 'UAH', locale)}.`, `У замовленні вище: замовлено на ${money(exampleOrder.totalMinor, 'UAH', locale)}, скомплектовано на ${money(exampleOrder.picked.totalMinor, 'UAH', locale)}; заблоковано ${money(examplePayment.amountMinor, 'UAH', locale)}, списано ${money(examplePayment.capturedMinor, 'UAH', locale)}, розблоковано ${money(examplePayment.amountMinor - examplePayment.capturedMinor, 'UAH', locale)}.`)}</p> : null}
      </Section>

      <Section index="4" title={t('The stages of a session', 'Стадії сесії')}>
        <ul>{stageCatalogue.map((s) => <li key={s.stage}><b>{pickText(s.label, locale)}</b> — {pickText(s.meaning, locale)}</li>)}</ul>
        <Figure caption={t('Fig. 3.2 — how many of the last 30 days’ attempts reached each stage.', 'Рис. 3.2 — скільки спроб за останні 30 днів дійшли до кожної стадії.')}><RiverFunnel stages={funnel} /></Figure>
      </Section>

      <Section index="5" title={t('After the payment', 'Після оплати')}>
        <p>{t('A payment lives on in its own stream: refunds and disputes take money back, and the bank settles what remains. In a group whose banks settle directly, the platform does not pay anything out; it follows each payment into its bank’s settlement batch and reconciles the batch. In the last 30 days the demo group recorded:', 'Платіж живе далі у власному потоці: повернення й спори забирають гроші назад, а банк розраховує те, що залишилося. У групі, з якою банки розраховуються напряму, платформа нічого не виплачує; вона простежує кожен платіж до пакета розрахунку його банку й звіряє пакет. За останні 30 днів демо-група записала:')}</p>
        <ul>
          <li>{t('Refunds', 'Повернення')}: <b>{refunds.length}</b>{byReason.size > 0 ? ` — ${[...byReason.entries()].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${pickText(refundReasonText(r), locale).toLowerCase()} ${n}`).join(', ')}` : ''}</li>
          {after.map((a) => <li key={a.type}>{labels[a.type]}: <b>{count(a.n, locale)}</b></li>)}
        </ul>
      </Section>

      <Section index="6" title={t('Replay is the check', 'Перевірка — це відтворення')}>
        <p>{t('No view is written by hand. Replaying the events, in order, through the boundaries’ projections gives exactly the views the cabinets read — the tests of the stand do it on every build — and the ledger balances in every currency because it is a projection of the payments’ distribution. The demo’s 75 days of history are themselves a replay: the same functions a live payment uses, driven by a seeded clock. The same mechanism answers “what if”: the routing studio replays real sessions under another policy.', 'Жодна проєкція не пишеться вручну. Відтворення подій по порядку через проєкції меж дає рівно ті проєкції, які читають кабінети, — тести стенда роблять це на кожній збірці, — а облік збалансований у кожній валюті, бо є проєкцією розподілу платежів. Самі 75 днів історії демо — теж відтворення: ті самі функції, що й живий платіж, під керуванням засіяного годинника. Той самий механізм відповідає на запитання «а що, якби»: студія маршрутизації відтворює справжні сесії за іншою політикою.')}</p>
        <p>{t('A webhook is a released event: its id names one event in its stream, so a receiver deduplicates on it, and every event a client system received can be found, with what it formed, on the session’s page.', 'Вебхук — це випущена подія: її id називає одну подію в потоці, тож отримувач дедуплікує за ним, а кожну подію, яку отримала система клієнта, можна знайти — разом із тим, що вона сформувала, — на сторінці сесії.')}</p>
      </Section>
    </ArticleFrame>
  );
}
