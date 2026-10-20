import { pickText } from '@river/i18n';
import { formatCardNumber, testCards, type TestCard } from '@river/psp-checkout';
import { merchantOf } from '@river/psp-runtime';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { CodeBlock, JsonBlock } from '@/components/cabinet/integration/CodeBlock';
import { UnitSelect, unitsFor } from '@/components/cabinet/integration/UnitSelect';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { sandboxOrderAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { flashSecret } from '@/lib/flashSecret';
import { money } from '@/lib/format';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { readQuery } from '@/lib/table';

const day = 86_400_000;

/**
 * The sandbox: a test order made here and paid on the demo pay page, with the test cards the stand-in issuer
 * knows — and the same steps as API calls, to show the shape of the four entities. No money moves.
 */
export default async function Sandbox({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'orders.write');
  const { t } = c;
  const back = c.link(`/sandbox${query.unit ? `?unit=${query.unit}` : ''}`);
  const payKey = query.done === 'created' ? (await flashSecret()).payKey : undefined;
  const invoiceId = payKey ? Object.entries(c.w.payKeys).find(([, k]) => k === payKey)?.[0] : undefined;
  const invoice = invoiceId ? c.w.views.invoices.get(invoiceId) : undefined;
  const created = invoice && c.visible.has(invoice.unitId) ? invoice : undefined;
  const units = unitsFor(c.w, c.actor.unitId, c.visible, (u) => u.status === 'active' && (u.kind === 'store' || u.kind === 'merchant') && c.may('orders.write', u.id));
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';

  // The API examples speak of a unit of this reach, so that they read as this integrator's own calls.
  const sample = units.find((u) => u.kind === 'store') ?? units[0];
  const merchantId = sample ? merchantOf(c.w, sample.id) : 'ou-merchant';
  const currency = c.w.units.find((u) => u.id === merchantId)?.currency ?? 'UAH';
  const seller = c.w.units.find((u) => u.kind === 'seller' && u.parentId === merchantId && c.visible.has(u.id));
  const unitMinor = currency === 'EUR' ? 4_500 : 45_000;
  const order = {
    unitId: sample?.id ?? 'ou-store', reference: 'SANDBOX-1042',
    lines: [{ sku: 'SANDBOX-1', title: { 'en-GB': 'Test item', uk: 'Тестовий товар' }, quantity: 2, unitMinor, totalMinor: 2 * unitMinor, sellerUnitId: seller?.id ?? null }],
    split: { rules: [
      ...(seller ? [{ recipientUnitId: seller.id, role: 'seller', basis: 'lines', bps: 9_000 }] : []),
      { recipientUnitId: 'ou-riverpay', role: 'psp_fee', basis: 'fee' },
      { recipientUnitId: merchantId, role: 'merchant', basis: 'remainder' },
    ] },
  };
  const dueAt = new Date(Date.parse(c.now.slice(0, 10)) + 7 * day + 18 * 3_600_000).toISOString();
  const inline = (v: unknown): string => (Array.isArray(v) ? `[${v.map(inline).join(', ')}]` : v && typeof v === 'object' ? `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }` : JSON.stringify(v));
  const list = <T,>(items: T[]) => items.map((x, i) => `      ${inline(x)}${i < items.length - 1 ? ',' : ''}`);
  const body = [
    `  -d '{`,
    `    "unitId": ${JSON.stringify(order.unitId)},`,
    `    "reference": ${JSON.stringify(order.reference)},`,
    '    "lines": [', ...list(order.lines), '    ],',
    '    "split": { "rules": [', ...list(order.split.rules), '    ] }',
    `  }'`,
  ];
  const session = scoped(c.w, c.visible).sessions.find((s) => s.outcome === 'succeeded');
  const auth = '  -H "Authorization: Bearer rp_test_sk_…" \\';

  const cardColumns: Column<TestCard>[] = [
    { key: 'number', label: t('Card number', 'Номер картки'), cell: (x) => ({ kind: 'mono', value: formatCardNumber(x.number) }) },
    { key: 'brand', label: t('Brand', 'Платіжна система'), cell: (x) => ({ kind: 'text', value: x.brand === 'prostir' ? 'ПРОСТІР' : x.brand === 'mastercard' ? 'Mastercard' : x.brand === 'amex' ? 'American Express' : 'Visa' }) },
    { key: 'label', label: t('What happens', 'Що станеться'), cell: (x) => ({ kind: 'text', value: pickText(x.label, locale) }) },
    { key: 'outcome', label: t('Answer', 'Відповідь'), cell: (x) => (x.outcome === 'approve' ? { kind: 'status', label: t('approved', 'схвалено'), tone: 'success' } : x.outcome === 'challenge' ? { kind: 'status', label: t('3-D Secure', '3-D Secure'), tone: 'info' } : { kind: 'status', label: t('declined', 'відхилено'), tone: 'danger' }) },
    { key: 'country', label: t('Issued in', 'Країна емітента'), cell: (x) => ({ kind: 'mono', value: x.issuerCountry }) },
  ];

  return (
    <>
      <CabinetHead kicker={t('Integration', 'Інтеграція')} title={t('Sandbox', 'Пісочниця')}
        lead={t('Make a test order and pay it on the demo pay page, the whole river from the source to the mouth. No money moves: the demo accepts only the test cards below, and the banks, wallets, lenders and kiosks are stand-ins — you give their answer with a button.', 'Створіть тестове замовлення й сплатіть його на демо-сторінці оплати — усю ріку від витоку до гирла. Гроші не рухаються: демо приймає лише тестові картки нижче, а банки, гаманці, кредитори й термінали імітовано — їхню відповідь ви даєте кнопкою.')} />
      <Flash query={query} locale={locale} />
      {payKey ? (
        <Panel tone="attention" className="mb-6" title={t('Your test order is ready — its pay link is shown this once', 'Тестове замовлення готове — платіжне посилання показуємо лише цього разу')}
          note={t('The key in the link is the payer’s authority; the river keeps only its hash. Open it, pay with a test card, and follow the bridges in the cabinet.', 'Ключ у посиланні — повноваження платника; ріка зберігає лише його хеш. Відкрийте посилання, сплатіть тестовою карткою й простежте мости в кабінеті.')}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={href(locale, `/pay/${payKey}`)} className="chamfer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)]">{t('Open the pay page', 'Відкрити сторінку оплати')} →</a>
            {created ? (
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.88rem]">
                <span className="tabular-nums text-ink-900">{money(created.amountMinor, created.currency, locale)}</span>
                <a href={c.link(`/invoices/${created.invoiceId}`)} className="font-mono text-[0.8rem] text-river-700 underline decoration-river-200 underline-offset-2">{t('invoice', 'інвойс')} {created.number}</a>
                <a href={c.link(`/orders/${created.orderId}`)} className="font-mono text-[0.8rem] text-river-700 underline decoration-river-200 underline-offset-2">{t('order', 'замовлення')} {c.w.views.orders.get(created.orderId)?.reference ?? created.orderId}</a>
              </span>
            ) : null}
          </div>
        </Panel>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Panel title={t('Create a test order', 'Створити тестове замовлення')} note={t('An order and its invoice in one step, through the same door an API call uses; the unit’s policies give it its split.', 'Замовлення та його інвойс одним кроком — через ті самі двері, що й виклик API; політики одиниці дають йому розщеплення.')}>
          {units.length > 0 ? (
            <form action={sandboxOrderAction} className="space-y-3">
              <input type="hidden" name="back" value={back} />
              <UnitSelect w={c.w} rootId={c.actor.unitId} units={units} locale={locale} label={t('Selling unit', 'Одиниця, що продає')} defaultValue={sample?.id} />
              <label className="block text-[0.8rem] text-ink-700">{t('What is sold', 'Що продаємо')}<input name="title" maxLength={80} defaultValue={t('Sandbox order', 'Тестове замовлення')} className={`mt-1 block w-full ${field}`} /></label>
              <label className="block text-[0.8rem] text-ink-700">{t('Amount, in the merchant’s currency', 'Сума у валюті мерчанта')}<input name="amount" inputMode="decimal" required pattern="\d+([.,]\d{1,2})?" defaultValue="100.00" className={`mt-1 block w-40 font-mono ${field}`} /></label>
              <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Create and get the pay link', 'Створити й отримати посилання')}</button>
            </form>
          ) : <p className="text-ink-500">{t('No unit in this scope can take payments yet.', 'У цих межах жодна одиниця ще не приймає оплату.')}</p>}
        </Panel>
        <Panel title={t('Test cards', 'Тестові картки')} flush note={t('Any future expiry date and any three digits as the code. Every other number — real or not — is refused in the browser and never sent.', 'Будь-який майбутній строк дії й будь-які три цифри коду. Будь-який інший номер — справжній чи ні — відхиляється ще в браузері й нікуди не надсилається.')}>
          <div className="px-1"><DataTable columns={cardColumns} rows={[...testCards]} locale={locale} query={{}} /></div>
          <p className="border-t border-graphite/15 px-4 py-3 text-[0.85rem] text-ink-700">{t('Pay by bank, QR, transfers, wallets, instalments, stablecoins and cash codes run against stand-ins: the pay page offers a button to approve in the bank, simulate the scan or the incoming money.', 'Оплата з банку, QR, перекази, гаманці, розстрочка, стейблкоїни й коди для готівки працюють з імітаціями: сторінка оплати пропонує кнопку — підтвердити в банку, імітувати сканування чи надходження коштів.')}</p>
        </Panel>
      </div>
      <Panel title={t('The same steps through the API', 'Ті самі кроки через API')} className="mt-6"
        note={t('Documentation only: the demo stand answers no API calls. These show the shape of the four entities — order, invoice, session, payment — as an integrator would meet them, with a test key.', 'Лише документація: демо-стенд не відповідає на виклики API. Вони показують форму чотирьох сутностей — замовлення, інвойс, сесія, платіж — так, як їх побачить інтегратор, із тестовим ключем.')}>
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <h3 className="font-semibold text-ink-900">1 · {t('The order', 'Замовлення')}</h3>
              <p className="mt-1 text-[0.88rem] text-ink-700">{t('What is bought and from whom. The split is optional: without it the template of the hierarchy applies. The PSP’s fee is a stream of the delta too; the remainder takes what is left, so the shares always sum to the amount.', 'Що купують і в кого. Розщеплення необов’язкове: без нього діє шаблон ієрархії. Комісія PSP — теж протока дельти; залишок забирає решту, тож частки завжди дорівнюють сумі.')}</p>
            </div>
            <CodeBlock code={[
              'curl https://api.river-pay.example/v1/orders \\',
              auth,
              '  -H "Idempotency-Key: 7c9e2f4a-order-1042" \\',
              '  -H "Content-Type: application/json" \\',
              ...body,
              '',
              `→ 201 Created  { "orderId": "ord_…", "status": "awaiting_payment", "totalMinor": ${2 * unitMinor}, "currency": "${currency}" }`,
            ].join('\n')} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <h3 className="font-semibold text-ink-900">2 · {t('The invoice', 'Інвойс')}</h3>
              <p className="mt-1 text-[0.88rem] text-ink-700">{t('The payable claim of the order: how much and by when. Its pay link carries a key shown once; the river keeps only the key’s hash.', 'Вимога до сплати за замовленням: скільки й до коли. Платіжне посилання несе ключ, показаний один раз; ріка зберігає лише його хеш.')}</p>
            </div>
            <CodeBlock code={[
              'curl https://api.river-pay.example/v1/invoices \\',
              auth,
              '  -H "Idempotency-Key: 7c9e2f4a-invoice-1042" \\',
              '  -H "Content-Type: application/json" \\',
              `  -d '{ "orderId": "ord_…", "dueAt": "${dueAt}", "allowPartial": false }'`,
              '',
              '→ 201 Created',
              JSON.stringify({ invoiceId: 'inv_…', number: `${(sample?.code ?? 'KVM').split('-')[0]}-${c.now.slice(0, 4)}-01042`, amountMinor: 2 * unitMinor, currency, dueAt, payUrl: 'https://river-pay.example/pay/<pay key, shown once>' }, null, 2),
            ].join('\n')} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <h3 className="font-semibold text-ink-900">3 · {t('The session', 'Сесія')}</h3>
              <p className="mt-1 text-[0.88rem] text-ink-700">{t('The payer opens the pay link: a session opens — one attempt to pay, its own stream of bridges. A failed attempt leaves the invoice payable; the next one is a new session. Your endpoint hears session.Opened, then capture.Completed and session.Succeeded, or session.Failed.', 'Платник відкриває посилання — відкривається сесія: одна спроба оплати, власний потік мостів. Невдала спроба лишає інвойс до сплати; наступна — нова сесія. Ваша кінцева точка отримає session.Opened, далі capture.Completed і session.Succeeded або session.Failed.')}</p>
            </div>
            <CodeBlock code={[
              `curl https://api.river-pay.example/v1/sessions/${session?.sessionId ?? 'ps_…'} \\`,
              auth.replace(/ \\$/, ''),
            ].join('\n')} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <h3 className="font-semibold text-ink-900">4 · {t('The session’s view', 'Проєкція сесії')}</h3>
              <p className="mt-1 text-[0.88rem] text-ink-700">{t('The answer is the session’s view — a fold of its bridges, and nothing else. Here, the newest attempt that reached the mouth in your reach; its paymentId leads on to the payment.', 'Відповідь — проєкція сесії: згортка її мостів, і нічого більше. Тут — найновіша спроба у ваших межах, що дійшла до гирла; її paymentId веде далі до платежу.')}</p>
            </div>
            {session ? <JsonBlock label="→ 200 OK" value={session} locale={locale} lines={30} /> : <p className="text-ink-500">{t('No attempt in your reach has reached the mouth yet.', 'У ваших межах жодна спроба ще не дійшла до гирла.')}</p>}
          </section>
        </div>
      </Panel>
    </>
  );
}
