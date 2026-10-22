import type { LocalisedText } from '@river/i18n';

const t = (en: string, uk: string): LocalisedText => ({ 'en-GB': en, uk });

export type SystemId = 'oms' | 'bonus' | 'erp' | 'bi';

/**
 * One of the retail group's own systems the platform is joined to: what it is, what goes each way, and the
 * keys, endpoints and provider connection it uses. `hosts` are the first labels of an endpoint's address
 * that mark an endpoint added later in the cabinet as this system's.
 */
export type SystemDefinition = {
  id: SystemId;
  icon: string;
  name: LocalisedText;
  role: LocalisedText;
  toPlatform: readonly LocalisedText[];
  fromPlatform: readonly LocalisedText[];
  keys: readonly string[];
  endpoints: readonly string[];
  hosts: readonly string[];
  provider: string | null;
};

/**
 * The group's systems as the platform sees them. None of them is replaced: the platform carries the
 * payment side of each order between them and the banks.
 */
export const systemCatalogue: readonly SystemDefinition[] = [
  {
    id: 'oms', icon: 'basket', keys: ['key-r-oms', 'key-r-test', 'key-r-web'], endpoints: ['wh-r-oms'], hosts: ['oms'], provider: null,
    name: t('Order system (OMS)', 'Система замовлень (OMS)'),
    role: t('Where the group’s online orders live. The web shop and the app place orders in it; the pickers complete them.', 'Тут живуть онлайн-замовлення групи. Сайт і застосунок створюють у ній замовлення; комплектувальники їх збирають.'),
    toPlatform: [
      t('Orders with their baskets, as they are placed (API: create an order).', 'Замовлення з кошиками, щойно їх оформлено (API: створення замовлення).'),
      t('The picking — weights, missing items, substitutes — and the request to capture the picked total (API: capture).', 'Комплектацію — вагу, відсутні товари, заміни — і запит на списання зібраної суми (API: списання).'),
    ],
    fromPlatform: [
      t('Payment events: holds, captures with the released rest, failed attempts, refunds, holds released in full (webhook).', 'Події оплати: блокування коштів, списання з розблокованим залишком, невдалі спроби, повернення, повністю зняті блокування (вебхук).'),
    ],
  },
  {
    id: 'bonus', icon: 'sparkle', keys: [], endpoints: ['wh-r-bonus'], hosts: ['bonus'], provider: 'bonus-system',
    name: t('Bonus system', 'Бонусна система'),
    role: t('The group’s loyalty programme: it keeps every payer’s bonus points. One point is worth one hryvnia.', 'Програма лояльності групи: вона веде бонусні бали кожного платника. Один бал дорівнює одній гривні.'),
    toPlatform: [
      t('The payer’s balance of bonus points, when the pay page asks for it.', 'Баланс бонусних балів платника, коли про нього питає сторінка оплати.'),
      t('A daily report of the points redeemed, for reconciliation. Its net is zero: no money moves.', 'Щоденний звіт про списані бали — для звірки. Його нетто — нуль: гроші не рухаються.'),
    ],
    fromPlatform: [
      t('Points reserved and redeemed for part of a basket; the rest is paid by card or another way (connection).', 'Бали, зарезервовані й списані за частину кошика; решту сплачують карткою чи іншим способом (підключення).'),
      t('Points returned when a payment with points is refunded.', 'Бали, повернені, коли оплату балами повертають.'),
      t('Captures and refunds, so that points are accrued and reversed (webhook).', 'Списання й повернення — щоб бали нараховувалися й сторнувалися (вебхук).'),
    ],
  },
  {
    id: 'erp', icon: 'book', keys: ['key-r-erp'], endpoints: ['wh-r-erp'], hosts: ['erp'], provider: null,
    name: t('Accounting system (ERP)', 'Облікова система (ERP)'),
    role: t('The group’s books. The platform hands it what to post; cash forecasting stays here.', 'Облік групи. Платформа передає їй, що провести; прогнозування грошових потоків лишається тут.'),
    toPlatform: [
      t('Requests for the settlements of a day (API: settlements).', 'Запити розрахунків за день (API: розрахунки).'),
    ],
    fromPlatform: [
      t('Settlement reports and bank credits, refunds and lost disputes, ready to post (webhook).', 'Звіти про розрахунки й зарахування банків, повернення і програні спори — готові до проведення (вебхук).'),
    ],
  },
  {
    id: 'bi', icon: 'chart', keys: [], endpoints: ['wh-r-bi'], hosts: ['bi'], provider: null,
    name: t('Analytics (BI)', 'Аналітика (BI)'),
    role: t('The group’s reports and dashboards.', 'Звіти й дашборди групи.'),
    toPlatform: [],
    fromPlatform: [
      t('Every event of every order, invoice, attempt, payment and settlement, as it happens (webhook: all events).', 'Кожна подія кожного замовлення, інвойсу, спроби, платежу й розрахунку — щойно вона стається (вебхук: усі події).'),
    ],
  },
];
