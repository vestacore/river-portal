import type { SettingDefinition } from '../types/SettingDefinition.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });
const admin = ['administrator'] as const;
const editors = ['administrator', 'editor'] as const;
const currencies = ['GBP', 'UAH', 'EUR', 'USD', 'PLN'].map((c) => ({ value: c, label: t(c, c) }));

/** The settings registry: every parameter the portal reads at run time. */
export const definitions: readonly SettingDefinition[] = [
  // Organisation
  { key: 'org.name', group: 'organisation', kind: 'localisedText', audience: 'public', label: t('Name', 'Назва'), default: t('Your organisation', 'Ваша організація'), editableBy: editors },
  { key: 'org.tagline', group: 'organisation', kind: 'localisedText', audience: 'public', label: t('Tagline', 'Гасло'), default: t('Help flows to where it is needed', 'Допомога тече туди, де вона потрібна'), editableBy: editors },
  { key: 'org.scope', group: 'organisation', kind: 'localisedText', audience: 'public', label: t('What we do, for whom and where (one sentence)', 'Що ми робимо, для кого і де (одне речення)'), help: t('Shown as the promise on the home page.', 'Показується як обіцянка на головній сторінці.'), default: t('We connect people who need help with people ready to share, and show every step openly.', 'Ми поєднуємо тих, кому потрібна допомога, з тими, хто готовий поділитися, і відкрито показуємо кожен крок.'), editableBy: editors },
  { key: 'org.legalName', group: 'organisation', kind: 'localisedText', audience: 'public', label: t('Legal name', 'Юридична назва'), default: t('', ''), editableBy: admin },
  { key: 'org.registration', group: 'organisation', kind: 'localisedText', audience: 'public', label: t('Registration', 'Реєстрація'), help: t('For example a charity number or an EDRPOU code.', 'Наприклад, номер благодійної організації або код ЄДРПОУ.'), default: t('', ''), editableBy: admin },
  { key: 'org.foundedYear', group: 'organisation', kind: 'number', audience: 'public', label: t('Working since (year)', 'Працюємо з (рік)'), min: 1900, max: 2100, default: 2022, editableBy: admin },
  { key: 'org.areasServed', group: 'organisation', kind: 'multiChoice', choicesFrom: 'oblasts', audience: 'public', label: t('Areas we serve', 'Де ми допомагаємо'), default: [], editableBy: admin },
  { key: 'org.helpKinds', group: 'organisation', kind: 'multiChoice', choicesFrom: 'categories', audience: 'public', label: t('Kinds of help we provide', 'Види допомоги'), default: [], editableBy: admin },
  { key: 'org.partners', group: 'organisation', kind: 'entries', audience: 'public', label: t('Partners (with their consent)', 'Партнери (за їхньою згодою)'), fields: [
      { key: 'name', label: t('Name', 'Назва'), kind: 'text' },
      { key: 'url', label: t('Website', 'Сайт'), kind: 'url' },
      { key: 'role', label: t('Role', 'Роль'), kind: 'localisedText' },
    ], default: [], editableBy: admin },
  { key: 'org.privacyAuthority', group: 'organisation', kind: 'localisedText', audience: 'public', label: t('Data protection authority', 'Орган захисту персональних даних'), default: t('', ''), editableBy: admin },
  // Contact
  { key: 'contact.email', group: 'contact', kind: 'email', audience: 'public', label: t('E-mail', 'Електронна пошта'), default: 'hello@example.org', editableBy: admin },
  { key: 'contact.phone', group: 'contact', kind: 'phone', audience: 'public', label: t('Phone', 'Телефон'), default: '', editableBy: admin },
  { key: 'contact.address', group: 'contact', kind: 'localisedText', audience: 'public', label: t('Address', 'Адреса'), default: t('', ''), editableBy: admin },
  { key: 'contact.hours', group: 'contact', kind: 'localisedText', audience: 'public', label: t('Opening hours', 'Години роботи'), default: t('', ''), editableBy: admin },
  { key: 'contact.pressEmail', group: 'contact', kind: 'email', audience: 'public', label: t('Press e-mail', 'Пошта для преси'), default: '', editableBy: admin },
  // People asking for help
  { key: 'help.replyWithinDays', group: 'help', kind: 'number', audience: 'public', label: t('We reply within (days)', 'Відповідаємо протягом (днів)'), min: 1, max: 14, default: 2, editableBy: admin },
  { key: 'help.emergency', group: 'help', kind: 'localisedText', audience: 'public', label: t('Emergency notice', 'Екстрене повідомлення'), default: t('In danger right now? Call 112.', 'Вам загрожує небезпека просто зараз? Телефонуйте 112.'), editableBy: editors },
  { key: 'help.quickExit', group: 'help', kind: 'boolean', audience: 'public', label: t('Show a ‘leave quickly’ button on help pages', 'Показувати кнопку «швидко вийти» на сторінках допомоги'), default: true, editableBy: admin },
  { key: 'help.quickExitUrl', group: 'help', kind: 'url', audience: 'public', label: t('Where ‘leave quickly’ goes', 'Куди веде «швидко вийти»'), default: 'https://www.google.com/', editableBy: admin },
  { key: 'help.channels', group: 'help', kind: 'entries', audience: 'public', label: t('Other ways to ask for help', 'Інші способи попросити допомоги'), fields: [
      { key: 'kind', label: t('Kind', 'Вид'), kind: 'choice', choices: ['phone', 'viber', 'telegram', 'whatsapp', 'email', 'visit'].map((k) => ({ value: k, label: t(k, k) })) },
      { key: 'label', label: t('Label', 'Підпис'), kind: 'localisedText' },
      { key: 'value', label: t('Number, handle or address', 'Номер, нікнейм або адреса'), kind: 'text' },
    ], default: [], editableBy: admin },
  { key: 'help.referrals', group: 'help', kind: 'entries', audience: 'public', label: t('If we cannot help: other services', 'Якщо ми не можемо допомогти: інші служби'), fields: [
      { key: 'name', label: t('Service', 'Служба'), kind: 'localisedText' },
      { key: 'description', label: t('What they do', 'Чим допомагають'), kind: 'localisedText' },
      { key: 'contact', label: t('Contact', 'Контакт'), kind: 'text' },
    ], default: [], editableBy: admin },
  // Giving
  { key: 'giving.kinds', group: 'giving', kind: 'multiChoice', audience: 'public', label: t('What people can give', 'Чим можна поділитися'), choices: [
      { value: 'money', label: t('Money', 'Гроші') }, { value: 'goods', label: t('Things', 'Речі') }, { value: 'transport', label: t('Transport', 'Перевезення') },
      { value: 'service', label: t('A service', 'Послуга') }, { value: 'time', label: t('Time', 'Час') },
    ], default: ['money', 'goods', 'transport', 'service', 'time'], editableBy: admin },
  { key: 'giving.suggestedAmounts', group: 'giving', kind: 'numbers', audience: 'public', label: t('Suggested amounts (in the reporting currency)', 'Запропоновані суми (у валюті звітності)'), default: [10, 25, 50, 100], editableBy: admin },
  { key: 'giving.instructions', group: 'giving', kind: 'localisedText', audience: 'public', label: t('What happens after someone pledges', 'Що відбувається після обіцянки'), default: t('A coordinator will write to you with how to send your gift.', 'Координатор напише вам, як передати дар.'), editableBy: editors },
  { key: 'giving.dropOff', group: 'giving', kind: 'entries', audience: 'public', label: t('Drop-off points for goods', 'Пункти прийому речей'), fields: [
      { key: 'place', label: t('Place', 'Місце'), kind: 'localisedText' },
      { key: 'hours', label: t('Hours', 'Години'), kind: 'localisedText' },
    ], default: [], editableBy: admin },
  // Money
  { key: 'money.reportingCurrency', group: 'money', kind: 'choice', audience: 'public', label: t('Reporting currency', 'Валюта звітності'), help: t('Pledges, campaign goals and all public totals use it. Change it only before real data exists.', 'Її використовують обіцянки, цілі кампаній і всі публічні підсумки. Змінюйте лише до появи реальних даних.'), choices: currencies, default: 'GBP', editableBy: admin },
  { key: 'money.fxRates', group: 'money', kind: 'entries', audience: 'team', label: t('Conversion rates to the reporting currency', 'Курси до валюти звітності'), help: t('Used for costs paid in other currencies; the rate used is recorded with each cost.', 'Для витрат в інших валютах; використаний курс записується з кожною витратою.'), fields: [
      { key: 'currency', label: t('Currency', 'Валюта'), kind: 'choice', choices: currencies },
      { key: 'rate', label: t('Rate', 'Курс'), kind: 'number' },
    ], default: [{ currency: 'GBP', rate: '1' }], editableBy: admin },
  { key: 'money.costApprovalLimit', group: 'money', kind: 'money', audience: 'team', label: t('Costs a lead coordinator approves alone (up to)', 'Витрати, які погоджує координатор сам (до)'), help: t('Larger costs wait for the Finance Steward (DP-06).', 'Більші витрати чекають на фінансового відповідального (DP-06).'), min: 0, default: 25000, editableBy: admin },
  // Publication
  { key: 'publication.safetyDelayDays', group: 'publication', kind: 'number', audience: 'team', label: t('Safety delay before a public report (days)', 'Безпекова затримка перед публічним звітом (днів)'), min: 14, floor: 14, max: 120, default: 14, editableBy: admin },
  // Home page
  { key: 'home.sections', group: 'home', kind: 'orderedChoices', audience: 'public', label: t('Home page sections, in order', 'Розділи головної, за порядком'), choices: [
      { value: 'hero', label: t('Promise: headline and drawing', 'Обіцянка: заголовок і креслення') }, { value: 'trust', label: t('Trust strip', 'Смуга довіри') },
      { value: 'doors', label: t('Three doors', 'Три входи') }, { value: 'counters', label: t('The river so far', 'Ріка на сьогодні') },
      { value: 'how', label: t('How it works', 'Як це працює') }, { value: 'campaigns', label: t('Campaigns', 'Кампанії') },
      { value: 'feed', label: t('Feed', 'Стрічка') }, { value: 'thanks', label: t('Thanks', 'Подяки') },
      { value: 'reports', label: t('Reports', 'Звіти') }, { value: 'about', label: t('Who we are', 'Хто ми') },
    ], default: ['hero', 'trust', 'doors', 'counters', 'how', 'campaigns', 'feed', 'thanks', 'reports', 'about'], editableBy: editors },
  { key: 'home.heroDrawing', group: 'home', kind: 'boolean', audience: 'public', label: t('Show the river drawing', 'Показувати креслення ріки'), default: true, editableBy: editors },
  { key: 'home.doors', group: 'home', kind: 'orderedChoices', audience: 'public', label: t('Doors', 'Входи'), choices: [
      { value: 'ask', label: t('I need help', 'Мені потрібна допомога') }, { value: 'give', label: t('I want to give', 'Хочу допомогти') },
      { value: 'carry', label: t('I can drive, store or volunteer', 'Можу везти, зберігати чи волонтерити') },
    ], default: ['ask', 'give', 'carry'], editableBy: editors },
  { key: 'home.trust', group: 'home', kind: 'orderedChoices', audience: 'public', label: t('Trust strip items', 'Елементи смуги довіри'), choices: [
      { value: 'since', label: t('Working since', 'Працюємо з') }, { value: 'registration', label: t('Registration', 'Реєстрація') },
      { value: 'costShare', label: t('Share spent on delivery', 'Частка на доставку') }, { value: 'lastDelivery', label: t('Last confirmed delivery', 'Остання підтверджена доставка') },
    ], default: ['since', 'registration', 'costShare', 'lastDelivery'], editableBy: editors },
  { key: 'home.counters', group: 'home', kind: 'orderedChoices', audience: 'public', label: t('Counters', 'Лічильники'), choices: [
      { value: 'needsReceived', label: t('Requests heard', 'Почуті звернення') }, { value: 'households', label: t('People reached', 'Люди, які отримали допомогу') },
      { value: 'deliveries', label: t('Deliveries', 'Доставки') }, { value: 'giftsPledged', label: t('Gifts', 'Дари') },
      { value: 'moneyReceived', label: t('Money received', 'Отримано грошима') }, { value: 'costs', label: t('Delivery costs', 'Витрати на доставку') },
    ], default: ['needsReceived', 'households', 'deliveries', 'giftsPledged', 'moneyReceived', 'costs'], editableBy: editors },
  { key: 'home.feedCount', group: 'home', kind: 'number', audience: 'public', label: t('Feed items on the home page', 'Дописів стрічки на головній'), min: 0, max: 9, default: 3, editableBy: editors },
  // Appearance
  { key: 'appearance.accent', group: 'appearance', kind: 'colour', audience: 'public', label: t('Accent colour', 'Акцентний колір'), help: t('Used for the main buttons with dark text; it must keep a contrast of at least 4.5 : 1.', 'Для головних кнопок із темним текстом; контраст має бути щонайменше 4,5 : 1.'), default: '#f0962a', editableBy: admin },
];
