import { pickText, type Locale } from '@river/i18n';
import { acquirers } from '@river/psp-instruments';
import type { PaymentView } from '@river/psp-payment';
import { effectiveFor, type World } from '@river/psp-runtime';
import { findPolicyDefinition, policyValue } from '@river/psp-units';
import { sinceDays, splitExample } from '@/lib/figures';
import { count, money } from '@/lib/format';
import { lt } from '@/lib/lt';
import { policyText } from '@/lib/policyText';
import { DeltaDrawing, type DeltaStream } from '../river/DeltaDrawing';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

const th = 'annot px-3 py-2 text-[0.56rem] font-normal text-ink-500';

/** Article 07 — the distribution of a payment: where it happens, what it is in a group with direct settlement, two payments of one order, a marketplace, its laws, money going back. */
export function SplitArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const r = worlds.retail;
  const p = worlds.psp;
  const name = (w: World, id: string) => (id.startsWith('acq:') ? pickText(acquirers.find((a) => a.id === id.slice(4))?.label, locale) : pickText(w.units.find((u) => u.id === id)?.name, locale)) || id;
  const roleWord: Record<string, [string, string]> = { seller: ['seller', 'продавець'], platform: ['marketplace (remainder)', 'маркетплейс (залишок)'], merchant: ['merchant (remainder)', 'мерчант (залишок)'], charity: ['good cause', 'добра справа'], psp_fee: ['PSP fee', 'комісія PSP'], acquirer_fee: ['acquirer’s fee, kept at settlement', 'комісія еквайра, утримується при розрахунку'], partner: ['franchisor', 'франчайзер'], reserve: ['rolling reserve', 'ковзний резерв'] };
  const tone = (role: string): DeltaStream['tone'] => (role === 'seller' ? 'seller' : role === 'charity' ? 'charity' : role === 'psp_fee' || role === 'acquirer_fee' ? 'fee' : role === 'reserve' ? 'reserve' : role === 'platform' ? 'platform' : 'merchant');
  const streams = (w: World, allocations: Array<{ recipientUnitId: string; role: string; amountMinor: number; currency: string }>) => allocations.map((a) => ({ label: a.role === 'psp_fee' ? 'River Pay' : name(w, a.recipientUnitId), role: t(roleWord[a.role]?.[0] ?? a.role, roleWord[a.role]?.[1] ?? a.role), amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: tone(a.role) }));

  const from = sinceDays(30);
  const retailPayment = [...r.views.payments.values()].filter((x) => x.capturedAt && x.capturedAt >= from && x.instrument === 'card' && x.allocations.some((a) => a.role === 'acquirer_fee') && x.capturedMinor < x.amountMinor).at(-1);
  const retailOrder = retailPayment ? r.views.orders.get(retailPayment.orderId) : undefined;
  const byOrder = new Map<string, PaymentView[]>();
  for (const x of r.views.payments.values()) if (x.capturedAt && x.capturedAt >= from) byOrder.set(x.orderId, [...(byOrder.get(x.orderId) ?? []), x]);
  const tendered = [...byOrder.entries()].filter(([, xs]) => xs.length > 1 && xs.some((x) => x.instrument === 'bonus_points'));
  const twoPart = tendered.length > 0 ? r.views.orders.get(tendered.at(-1)![0]) : undefined;
  const twoPayments = twoPart ? byOrder.get(twoPart.orderId) ?? [] : [];
  const ex = splitExample(p);
  const units = ['ou-kvitka-market', 'ou-dnipro-travel', 'ou-zerno-if', 'ou-zerno-uzh', 'ou-amber'];
  const keys = ['split.template', 'split.commission.bps', 'split.charity.bps', 'settlement.hold.days', 'settlement.reserve.bps'];
  return (
    <ArticleFrame locale={locale} slug="split" sheet="RP-07" title={t('The distribution of a payment', 'Розподіл платежу')}
      lead={t('When a payment is captured, its amount is divided into shares by a plan the structure set before anyone paid: what the unit receives, what the bank keeps as its fee, and — in a marketplace — what each seller, the platform and a good cause receive. The shares are computed in whole kopiykas and always add up to the amount. The ledger is not written by anyone: it is a projection of this division, so it always balances.', 'Коли платіж списано, його суму ділять на частки за планом, який структура задала ще до оплати: що отримує одиниця, що утримує банк як комісію, а в маркетплейсі — що отримує кожен продавець, платформа й добра справа. Частки рахуються в цілих копійках і завжди складаються в суму платежу. Облік ніхто не пише: він є проєкцією цього розподілу, тому завжди збалансований.')}
      cta={{ label: t('Buy and see the distribution', 'Купіть і подивіться на розподіл'), path: '/shop' }}>
      <Section index="1" title={t('In a group whose banks settle directly', 'У групі, з якою банки розраховуються напряму')}>
        <p>{t('In the retail group the platform holds no money. A captured card payment has two shares: the unit’s net and the acquirer’s fee under the group’s agreement. The bank keeps its fee when it settles and credits the net to the group’s account; the platform records what is owed so that reconciliation can check it.', 'У роздрібній групі платформа не тримає коштів. Списаний картковий платіж має дві частки: суму для одиниці й комісію еквайра за договором групи. Банк утримує свою комісію при розрахунку й зараховує решту на рахунок групи; платформа записує, що кому належить, щоб звірка могла це перевірити.')}</p>
        {retailPayment ? (
          <Figure caption={`${t('Fig. 7.1 — a card payment of the online shop, captured after picking', 'Рис. 7.1 — картковий платіж інтернет-магазину, списаний після комплектації')}${retailOrder ? ` · ${retailOrder.reference}` : ''} · ${t('drawn to scale', 'у масштабі')}`}>
            <DeltaDrawing total={[t('Captured', 'Списано'), money(retailPayment.capturedMinor, retailPayment.currency, locale)]} streams={streams(r, retailPayment.allocations)} />
          </Figure>
        ) : null}
        <p>{t('The ledger reads it as one balanced entry: the acquirer owes the captured amount in clearing; of it, the net is payable to the unit and the fee is the acquirer’s. When the bank’s report and credit arrive, the clearing is closed — or the difference stays visible.', 'Облік читає це як один збалансований запис: еквайр винен списану суму в розрахунках; з неї сума до зарахування належить одиниці, а комісія — еквайру. Коли надходять звіт банку й зарахування, розрахунки закриваються — або різниця лишається на виду.')}</p>
      </Section>

      {twoPart ? (
        <Section index="2" title={t('Two payments of one order', 'Два платежі одного замовлення')}>
          <p>{t(`One order can be paid by several instruments: part with bonus points, the rest by card. Each part is a payment of its own with its own distribution; the order is paid when together they cover the picked amount. In the last 30 days ${count(tendered.length, locale)} online orders were paid this way. For example, order ${twoPart.reference}:`, `Одне замовлення можна сплатити кількома інструментами: частину бонусними балами, решту карткою. Кожна частина — окремий платіж із власним розподілом; замовлення сплачене, коли разом вони покривають суму комплектації. За останні 30 днів так сплачено ${count(tendered.length, locale)} онлайн-замовлень. Наприклад, замовлення ${twoPart.reference}:`)}</p>
          <ul>{twoPayments.map((x) => <li key={x.paymentId}>{x.instrument === 'bonus_points' ? t('bonus points', 'бонусні бали') : t('card', 'картка')}: <b>{money(x.capturedMinor, x.currency, locale)}</b> — {x.allocations.map((a) => `${name(r, a.recipientUnitId)} ${money(a.amountMinor, a.currency, locale)}`).join(', ')}</li>)}</ul>
        </Section>
      ) : null}

      {ex ? (
        <Section index="3" title={t('In a marketplace', 'У маркетплейсі')}>
          <p>{t('Where the platform is assembled as a payment service provider that holds its merchants’ money, the same division has more shares. A marketplace order of the demo’s PSP assembly: three sellers, a share for a good cause, the marketplace’s commission and the provider’s fee.', 'Там, де платформу зібрано як надавача платіжних послуг, що тримає кошти мерчантів, той самий розподіл має більше часток. Замовлення маркетплейсу з PSP-збірки демо: три продавці, частка на добру справу, комісія маркетплейсу й комісія провайдера.')}</p>
          <Figure caption={`${t('Fig. 7.2 — the distribution of a marketplace payment', 'Рис. 7.2 — розподіл платежу маркетплейсу')} · ${ex.order.reference} · ${t('drawn to scale', 'у масштабі')}`}>
            <DeltaDrawing total={[t('Captured', 'Списано'), money(ex.payment.capturedMinor, ex.payment.currency, locale)]} streams={streams(p, ex.payment.allocations)} />
          </Figure>
          <p>{t('The plan comes from the effective policies of the unit that sells: a template (direct, marketplace, agency, franchise), the commission, a share for a good cause, how long shares are held and how much is kept as a rolling reserve. In effect now for some of that assembly’s merchants:', 'План береться з чинних політик одиниці, що продає: шаблон (напряму, маркетплейс, агентська схема, франшиза), комісія, частка на добру справу, скільки утримувати частки і скільки залишати в ковзному резерві. Що діє зараз для кількох мерчантів цієї збірки:')}</p>
          <div className="not-prose overflow-x-auto border border-graphite/20">
            <table className="w-full min-w-[720px] text-left text-[0.85rem]">
              <thead><tr className="border-b border-ink-900/80"><th className={th}>{t('Merchant', 'Мерчант')}</th>{keys.map((k) => <th key={k} className={th}>{pickText(findPolicyDefinition(k).label, locale)}</th>)}</tr></thead>
              <tbody>{units.filter((id) => p.units.some((u) => u.id === id)).map((id) => { const e = effectiveFor(p, id); const u = p.units.find((x) => x.id === id)!; return <tr key={id} className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-900">{name(p, id)}</td>{keys.map((k) => <td key={k} className="px-3 py-2 text-ink-700">{policyText(findPolicyDefinition(k), policyValue(e, k), locale, u.currency, (x) => name(p, x))}</td>)}</tr>; })}</tbody>
            </table>
          </div>
        </Section>
      ) : null}

      <Section index="4" title={t('The rules of the division', 'Правила розподілу')}>
        <ul>
          <li>{t('Every share is computed in whole kopiykas and rounded down. Exactly one rule takes the remainder, so the shares always add up to the captured amount: no money appears or disappears, whatever the amount.', 'Кожна частка рахується в цілих копійках з округленням донизу. Рівно одне правило забирає залишок, тож частки завжди дорівнюють списаній сумі: гроші не з’являються і не зникають, хоч якою була б сума.')}</li>
          <li>{t('A partial capture — after picking, for instance — scales the plan to the captured amount.', 'Часткове списання — наприклад, після комплектації — масштабує план до списаної суми.')}</li>
          <li>{t('A fee is a share like any other: always visible to the unit, and to the payer before paying where the unit chooses.', 'Комісія — така сама частка, як інші: одиниця бачить її завжди, а платник — ще до оплати, якщо так вирішила одиниця.')}</li>
          <li>{t('A rolling reserve, where a provider holds money, is carved out of the remainder as its own share. A retail group whose banks settle directly has none.', 'Ковзний резерв — там, де кошти тримає провайдер, — вирізається із залишку як окрема частка. У роздрібній групі, з якою банки розраховуються напряму, його немає.')}</li>
        </ul>
      </Section>

      <Section index="5" title={t('When money goes back', 'Коли гроші повертаються')}>
        <p>{t('A refund or a lost dispute is taken back from the same shares that received the money, in proportion. The fee is not returned by the bank; the unit’s share carries it. Where the banks settle directly, a refund is netted by the bank in a later settlement batch, and reconciliation checks that it was netted once and in full. The ledger forms the reversal from the payment’s own stream, so every refund is one more balanced entry.', 'Повернення чи програний спір забирається з тих самих часток, що отримали гроші, пропорційно. Банк комісію не повертає; її несе частка одиниці. Там, де банки розраховуються напряму, повернення банк утримує в одному з наступних пакетів розрахунку, а звірка перевіряє, що його утримано один раз і повністю. Облік формує сторнування з власного потоку платежу, тож кожне повернення — ще один збалансований запис.')}</p>
      </Section>
    </ArticleFrame>
  );
}
