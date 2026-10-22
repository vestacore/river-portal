import type { LocalisedText } from '@river/i18n';
import type { StandId } from '@river/psp-runtime';

const t = (en: string, uk: string): LocalisedText => ({ 'en-GB': en, uk });

/** One step of the data between the platform and the systems around it: who sends, who receives, what, and how. */
export type FlowStep = { from: LocalisedText; to: LocalisedText; what: LocalisedText; how: LocalisedText };

const platform = t('Platform', 'Платформа');
const oms = t('Order system (OMS)', 'Система замовлень (OMS)');
const bonus = t('Bonus system', 'Бонусна система');
const banks = t('Banks and providers', 'Банки й провайдери');
const api = t('API call', 'Виклик API');
const webhook = t('Webhook', 'Вебхук');
const connection = t('Connection', 'Підключення');

/**
 * The data of one online order and of a day's settlement, step by step, as each stand is assembled. The
 * retail group keeps its systems and its stores' terminals; the PSP holds its merchants' money.
 */
export const dataFlows: Record<StandId, readonly FlowStep[]> = {
  retail: [
    { from: oms, to: platform, how: api, what: t('An order with its basket. The platform issues the invoice and the pay page.', 'Замовлення з кошиком. Платформа виставляє інвойс і відкриває сторінку оплати.') },
    { from: t('Payer', 'Платник'), to: platform, how: t('Pay page', 'Сторінка оплати'), what: t('Pays on the pay page. A card is held on the estimated basket; bonus points can pay part of it.', 'Сплачує на сторінці оплати. На картці блокуються кошти на орієнтовну суму кошика; частину можна сплатити бонусними балами.') },
    { from: platform, to: bonus, how: connection, what: t('Reserves and redeems the points the payer chose to use.', 'Резервує й списує бали, які платник вирішив використати.') },
    { from: platform, to: banks, how: connection, what: t('Sends each attempt to the bank chosen by approval and cost, on-us first where agreed — on-us means the payer’s card was issued by the acquiring bank itself. Later come the capture and any refund.', 'Надсилає кожну спробу до банку, обраного за схваленням і вартістю, спершу on-us, де це домовлено, — on-us означає, що картку платника випустив сам банк-еквайр. Далі — списання і, якщо треба, повернення.') },
    { from: oms, to: platform, how: api, what: t('The picking. The invoice follows the picked total; the capture takes it, less the bonus points, and the rest of the hold is released.', 'Комплектацію. Інвойс іде за зібраною сумою; списання бере її за вирахуванням бонусних балів, а залишок блокування розблоковується.') },
    { from: platform, to: oms, how: webhook, what: t('Payment events: holds, captures, failed attempts, refunds.', 'Події оплати: блокування коштів, списання, невдалі спроби, повернення.') },
    { from: platform, to: bonus, how: webhook, what: t('Captures and refunds, so that points are accrued and reversed.', 'Списання й повернення — щоб нараховувати й сторнувати бали.') },
    { from: t('Store tills', 'Каси магазинів'), to: platform, how: t('Daily report', 'Щоденний звіт'), what: t('The day’s card sales of every store, as totals — for reconciliation only.', 'Карткові продажі кожного магазину за день, підсумками, — лише для звірки.') },
    { from: banks, to: platform, how: t('Reports and statements', 'Звіти й виписки'), what: t('Settlement reports with their breakdown by card, and bank statements with the credits.', 'Звіти про розрахунки з розбивкою за картками і банківські виписки із зарахуваннями.') },
    { from: platform, to: t('Accounting system (ERP)', 'Облікова система (ERP)'), how: t('Webhook and API', 'Вебхук і API'), what: t('Settlements, credits, refunds and lost disputes, ready to post. The ERP can also ask for a day’s settlements.', 'Розрахунки, зарахування, повернення і програні спори — готові до проведення. ERP також може запитати розрахунки за день.') },
    { from: platform, to: t('Analytics (BI)', 'Аналітика (BI)'), how: webhook, what: t('Every event, as it happens.', 'Кожна подія, щойно вона стається.') },
  ],
  psp: [
    { from: t('Merchant’s system', 'Система мерчанта'), to: platform, how: api, what: t('An order and its invoice.', 'Замовлення та його інвойс.') },
    { from: t('Payer', 'Платник'), to: platform, how: t('Pay page', 'Сторінка оплати'), what: t('Pays on the pay page with the instrument of their choice.', 'Сплачує на сторінці оплати обраним інструментом.') },
    { from: platform, to: banks, how: connection, what: t('Each attempt, routed to an acquirer or a rail; later the capture and any refund.', 'Кожна спроба, спрямована до еквайра чи платіжної рейки; далі — списання і, якщо треба, повернення.') },
    { from: platform, to: t('Merchants’ systems', 'Системи мерчантів'), how: webhook, what: t('The events each endpoint hears.', 'Події, які отримує кожна кінцева точка.') },
    { from: banks, to: platform, how: t('Settlement', 'Розрахунок'), what: t('The money of the payments, settled to the platform’s accounts.', 'Кошти платежів, зараховані на рахунки платформи.') },
    { from: platform, to: t('Merchants and sellers', 'Мерчанти й продавці'), how: t('Payout', 'Виплата'), what: t('Each share, less the fee, paid out by schedule.', 'Кожна частка за вирахуванням комісії, виплачена за графіком.') },
  ],
};
