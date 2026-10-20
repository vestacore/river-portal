import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { effectiveFor, type World } from '@river/psp-runtime';
import { policyValue, findPolicyDefinition } from '@river/psp-units';
import { splitExample, sinceDays } from '@/lib/figures';
import { money } from '@/lib/format';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { policyText } from '@/lib/policyText';
import { DeltaDrawing } from '../river/DeltaDrawing';
import { ArticleFrame, Figure, Section } from './ArticleFrame';

/** Article 01 — split payments: the delta of one payment, its plan from the hierarchy, its laws, its life after. */
export function SplitArticle({ locale, w }: { locale: Locale; w: World }) {
  const t = lt(locale);
  const ex = splitExample(w);
  const unitName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale);
  const roleWord: Record<string, [string, string]> = { seller: ['seller', 'продавець'], platform: ['marketplace (remainder)', 'маркетплейс (залишок)'], merchant: ['merchant (remainder)', 'мерчант (залишок)'], charity: ['good cause', 'добра справа'], psp_fee: ['PSP fee', 'комісія PSP'], partner: ['franchisor', 'франчайзер'], reserve: ['rolling reserve', 'ковзний резерв'] };
  const basisWord: Record<string, [string, string]> = { lines: ['its lines less the commission', 'свої позиції мінус комісія'], percent: ['a share of the amount', 'частка суми'], fixed: ['a fixed amount', 'фіксована сума'], fee: ['the tariff’s fee', 'комісія за тарифом'], remainder: ['what is left', 'що залишилося'] };
  const tone = (role: string) => (role === 'seller' ? 'seller' : role === 'charity' ? 'charity' : role === 'psp_fee' ? 'fee' : role === 'reserve' ? 'reserve' : role === 'platform' ? 'platform' : 'merchant') as 'seller';
  const units = ['ou-kvitka-market', 'ou-dnipro-travel', 'ou-zerno-if', 'ou-zerno-uzh', 'ou-kvitka-pharmacy', 'ou-amber', 'ou-open-river'];
  const keys = ['split.template', 'split.commission.bps', 'split.charity.bps', 'settlement.hold.days', 'settlement.reserve.bps'];
  const from = sinceDays(30);
  const byRole = new Map<string, number>();
  for (const p of w.views.payments.values()) for (const x of p.payouts) if (x.at >= from && p.currency === 'UAH') { const a = p.allocations.find((y) => y.recipientUnitId === x.recipientUnitId && y.rule === x.rule); const role = a?.role ?? 'merchant'; byRole.set(role, (byRole.get(role) ?? 0) + x.amountMinor); }
  return (
    <ArticleFrame locale={locale} slug="split" sheet="RP-01" title={t('One order, many streams', 'Одне замовлення — багато протоків')}
      lead={t('In River Pay the split is neither a report made afterwards nor a transfer someone remembers to send. It is a bridge of the payment session itself: at the capture the money divides into streams — sellers, the marketplace, a good cause, the fee — by rules the hierarchy set before anyone paid. Every stream is a share of a real amount, and together they always make up that amount to the last kopiyka.', 'У River Pay розщеплення — не звіт постфактум і не переказ, про який хтось має не забути. Це міст самої платіжної сесії: у момент списання гроші розходяться на протоки — продавцям, маркетплейсу, на добру справу, на комісію — за правилами, які ієрархія задала ще до оплати. Кожен протік — частка реальної суми, а разом вони завжди складають цю суму до копійки.')}
      cta={{ label: t('Buy and watch it split', 'Купіть і подивіться на розщеплення'), path: '/shop' }}>
      <Section index="1" title={t('Where the split happens', 'Де відбувається розщеплення')}>
        <p>{t('A payment session runs from the source — an invoice in front of a payer — to the mouth. At the capture bridge the money is taken; the very next bridge, ', 'Платіжна сесія тече від витоку — інвойсу перед платником — до гирла. На мосту списання гроші взято; одразу наступний міст, ')}<code>split.Allocated</code>{t(', divides it. The figure of the machine writes it from three things it already holds: the captured amount, the order’s split plan, and the fee of the merchant’s active tariff. Nothing is computed later; nothing can drift.', ', розділяє їх. Фігура машини записує його з трьох речей, які вже має: списаної суми, плану розщеплення замовлення та комісії за чинним тарифом мерчанта. Нічого не рахується пізніше; нічого не може розійтися.')}</p>
        <p>{t('The ledger is not written by anyone: it is a projection of this bridge. The acquirer owes the whole amount; each recipient is owed its share; the PSP has earned its fee — one balanced double entry per split.', 'Облік ніхто не пише: він є проєкцією цього мосту. Еквайр винен усю суму; кожному одержувачу винні його частку; PSP заробив комісію — один збалансований подвійний запис на кожне розщеплення.')}</p>
        {ex ? (
          <Figure caption={`${t('A real payment of the demo marketplace', 'Справжній платіж демо-маркетплейсу')} · ${ex.order.reference} · ${t('drawn to scale', 'у масштабі')}`}>
            <DeltaDrawing total={[t('Captured', 'Списано'), money(ex.payment.capturedMinor, ex.payment.currency, locale)]} streams={ex.payment.allocations.map((a) => ({ label: a.role === 'psp_fee' ? 'River Pay' : unitName(a.recipientUnitId), role: t(roleWord[a.role]![0], roleWord[a.role]![1]), amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: tone(a.role) }))} />
          </Figure>
        ) : null}
      </Section>

      <Section index="2" title={t('The plan comes from the hierarchy', 'План приходить з ієрархії')}>
        <p>{t('When an order is created it receives its split plan from the effective policies of the unit that sells: a template (direct, marketplace, agency, franchise), the marketplace’s commission, a share for a good cause and its recipient, how long shares are held and how much is kept as a rolling reserve. A holding sets them once for every shop below it; a merchant may change what is not enforced. Here is what is in effect right now for some of the demo’s merchants:', 'Під час створення замовлення воно отримує план розщеплення з чинних політик одиниці, що продає: шаблон (напряму, маркетплейс, агентська схема, франшиза), комісію маркетплейсу, частку на добру справу та її одержувача, скільки утримувати частки і скільки залишати в ковзному резерві. Холдинг задає їх один раз для всіх точок нижче; мерчант може змінити те, що не закріплено. Ось що діє просто зараз для кількох мерчантів демо:')}</p>
        <div className="not-prose overflow-x-auto border border-graphite/20">
          <table className="w-full text-left text-[0.85rem]">
            <thead><tr className="border-b border-ink-900/80"><th className="annot px-3 py-2 text-[0.58rem] font-normal text-ink-500">{t('Merchant', 'Мерчант')}</th>{keys.map((k) => <th key={k} className="annot px-3 py-2 text-[0.58rem] font-normal text-ink-500">{pickText(findPolicyDefinition(k).label, locale)}</th>)}</tr></thead>
            <tbody>{units.map((id) => { const e = effectiveFor(w, id); const u = w.units.find((x) => x.id === id)!; return <tr key={id} className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-900">{unitName(id)}</td>{keys.map((k) => <td key={k} className="px-3 py-2 text-ink-700">{policyText(findPolicyDefinition(k), policyValue(e, k), locale, u.currency, unitName)}</td>)}</tr>; })}</tbody>
          </table>
        </div>
        <p>{t('Look at Zerno Uzhhorod: it blocks the inheritance of its holding’s policies, yet still pays the franchise royalty — because the holding enforced the franchise template. That is the hierarchy at work: what must not change is enforced; everything else may be tuned below.', 'Подивіться на «Зерно Ужгород»: воно блокує успадкування політик свого холдингу, але все одно сплачує роялті франшизи — бо холдинг закріпив шаблон франшизи. Так працює ієрархія: те, що не можна змінювати, закріплено; решту можна налаштовувати нижче.')}</p>
      </Section>

      <Section index="3" title={t('The laws of the delta', 'Закони дельти')}>
        <ul>
          <li>{t('Every share is computed in whole minor units and rounded down. Exactly one rule takes the remainder, so the shares always sum to the captured amount — no money is made or lost, whatever the amount.', 'Кожна частка рахується в цілих копійках з округленням донизу. Рівно одне правило забирає залишок, тож частки завжди дорівнюють списаній сумі — гроші не з’являються і не зникають, хоч якою була б сума.')}</li>
          <li>{t('A seller receives its own lines less the commission. A partial capture scales the lines in proportion.', 'Продавець отримує власні позиції мінус комісія. Часткове списання пропорційно масштабує позиції.')}</li>
          <li>{t('A rolling reserve is carved out of the remainder as its own stream, held for ninety days.', 'Ковзний резерв вирізається із залишку як окремий протік і утримується дев’яносто днів.')}</li>
          <li>{t('The PSP’s fee is a stream like any other — visible to the merchant always, and to the payer before paying when the unit says so.', 'Комісія PSP — такий самий протік, як інші: мерчант бачить її завжди, а платник — ще до оплати, якщо так вирішила одиниця.')}</li>
        </ul>
        {ex ? (
          <div className="not-prose overflow-x-auto border border-graphite/20">
            <table className="w-full text-left text-[0.85rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Rule', 'Правило'), t('Recipient', 'Одержувач'), t('Basis', 'Основа'), t('Amount', 'Сума')].map((h) => <th key={h} className="annot px-3 py-2 text-[0.58rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
              <tbody>{ex.payment.allocations.map((a) => { const rule = ex.order.split.rules[a.rule]; return <tr key={`${a.recipientUnitId}${a.rule}`} className="border-b border-graphite/15"><td className="px-3 py-2 font-mono text-[0.78rem]">{a.rule < 0 ? '—' : a.rule}</td><td className="px-3 py-2">{a.role === 'psp_fee' ? 'River Pay' : unitName(a.recipientUnitId)}</td><td className="px-3 py-2 text-ink-700">{rule ? t(basisWord[rule.basis]![0], basisWord[rule.basis]![1]) : t('reserve, from the remainder', 'резерв із залишку')}{rule?.bps !== undefined ? ` · ${rule.bps / 100} %` : ''}</td><td className="px-3 py-2 text-right tabular-nums">{money(a.amountMinor, a.currency, locale)}</td></tr>; })}
                <tr className="border-t border-ink-900/80"><td colSpan={3} className="px-3 py-2 font-semibold">{t('Sum of the streams', 'Сума протоків')}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{money(ex.payment.allocations.reduce((s, a) => s + a.amountMinor, 0), ex.payment.currency, locale)}</td></tr></tbody>
            </table>
          </div>
        ) : null}
      </Section>

      <Section index="4" title={t('When money goes back', 'Коли гроші повертаються')}>
        <p>{t('A refund or a lost dispute is taken back from the same streams that received the money, in proportion to what each received. The PSP keeps its fee; the merchant’s remainder carries the rounding and, on a full refund, the fee the PSP kept — its balance may go below zero, never the payer’s money. The ledger forms the reversal from the payment’s own stream, so every refund is one more balanced entry.', 'Повернення чи програний спір забирається з тих самих протоків, що отримали гроші, пропорційно до отриманого. PSP залишає собі комісію; залишок мерчанта несе округлення і, при повному поверненні, утриману комісію — його баланс може стати від’ємним, але ніколи не гроші платника. Облік формує сторнування з власного потоку платежу, тож кожне повернення — ще один збалансований запис.')}</p>
      </Section>

      <Section index="5" title={t('Payouts follow the streams', 'Виплати йдуть за протоками')}>
        <p>{t('Each stream is paid out to its own recipient on its unit’s schedule — the next day in Ukraine, in two days in Europe — once its hold has passed, in one batch per recipient per day. In the last 30 days the demo paid out, in hryvnias:', 'Кожен протік виплачується власному одержувачу за графіком його одиниці — наступного дня в Україні, через два дні в Європі — щойно мине утримання, одним пакетом на одержувача на день. За останні 30 днів демо виплатило в гривнях:')}</p>
        <ul>{[...byRole.entries()].sort((a, b) => b[1] - a[1]).map(([role, minor]) => <li key={role}>{t(roleWord[role]?.[0] ?? role, roleWord[role]?.[1] ?? role)}: <b>{money(minor, 'UAH', locale)}</b></li>)}</ul>
        <p><Link href={href(locale, '/demo')}>{t('Open the operator’s cabinet to see the batches and the ledger', 'Відкрийте кабінет операціоніста, щоб побачити пакети та облік')}</Link>.</p>
      </Section>
    </ArticleFrame>
  );
}
