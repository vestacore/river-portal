import type { ProfileId } from '../types/ProfileId.ts';
import type { ProfileTexts } from '../types/ProfileTexts.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/**
 * Example identity texts for each profile, in both locales. Everything here is fictional:
 * organisations, people, addresses, registration numbers, phone numbers, e-mails and websites.
 * The only real numbers are the emergency numbers 112 (Ukraine) and 999 (United Kingdom).
 */
export const profileTexts: Record<ProfileId, ProfileTexts> = {
  'state-programme': {
    label: t('State programme', 'Державна програма'),
    description: t(
      'Choose this for a national or state-level programme that coordinates help in every oblast through regional hubs and partner NGOs.',
      'Оберіть цей профіль для національної чи державної програми, що координує допомогу в усіх областях через регіональні хаби та партнерські громадські організації.',
    ),
    orgName: t('One River', 'Єдина ріка'),
    tagline: t('Every oblast, one river of help', 'Усі області — одна ріка допомоги'),
    scope: t(
      'We help families, older people and whole communities in every oblast of Ukraine with food, heating, hygiene kits and emergency home repairs, delivered through regional hubs and partner NGOs close to each community.',
      'Ми допомагаємо родинам, літнім людям і цілим громадам в усіх областях України продуктами, обігрівом, гігієнічними наборами й терміновим ремонтом житла — через регіональні хаби та партнерські організації на місцях.',
    ),
    legalName: t('Demo State Agency for Humanitarian Coordination (fictional)', 'Демонстраційне державне агентство гуманітарної координації (вигадане)'),
    registration: t(
      'Set up by government resolution No. 000 of 1 March 2024; EDRPOU code 00000000 (both fictional)',
      'Утворено постановою уряду № 000 від 1 березня 2024 року; код ЄДРПОУ 00000000 (постанову й код вигадано)',
    ),
    address: t('1 Example Street, Kyiv 00000, Ukraine (fictional address)', 'вул. Прикладна, 1, м. Київ, 00000, Україна (вигадана адреса)'),
    hours: t(
      'Hotline: every day, 8:00–20:00. Office: Monday to Friday, 9:00–18:00 (Kyiv time).',
      'Гаряча лінія: щодня, 8:00–20:00. Офіс: з понеділка до п’ятниці, 9:00–18:00 (за київським часом).',
    ),
    privacyAuthority: t(
      'the data protection authority: the Ukrainian Parliament Commissioner for Human Rights',
      'орган із захисту персональних даних — Уповноважений Верховної Ради України з прав людини',
    ),
    emergency: t(
      'In danger right now? Call 112. Our hotline is not an emergency service.',
      'Вам загрожує небезпека просто зараз? Телефонуйте 112. Наша гаряча лінія — не екстрена служба.',
    ),
    channels: [
      { kind: 'phone', label: t('Free hotline', 'Безкоштовна гаряча лінія'), value: '0 800 000 000' },
      { kind: 'viber', label: t('Write to us on Viber', 'Напишіть нам у Viber'), value: '+380 00 000 00 00' },
      { kind: 'email', label: t('E-mail', 'Електронна пошта'), value: 'hello@one-river.example.org' },
    ],
    referrals: [
      {
        name: t('Example: free legal aid centre', 'Приклад: центр безоплатної правничої допомоги'),
        description: t(
          'Advice on documents, housing, payments and lost property. This is an example: replace it with a real service in your area.',
          'Консультації щодо документів, житла, виплат і втраченого майна. Це приклад — замініть його справжньою службою у вашій місцевості.',
        ),
        contact: '+380 00 000 00 01',
      },
      {
        name: t('Example: psychological support line', 'Приклад: лінія психологічної підтримки'),
        description: t(
          'Someone to talk to, free and in confidence. This is an example: replace it with a real service.',
          'Можна поговорити з фахівцем безоплатно й конфіденційно. Це приклад — замініть його справжньою службою.',
        ),
        contact: '+380 00 000 00 02',
      },
      {
        name: t('Example: social services centre in your community', 'Приклад: центр надання соціальних послуг вашої громади'),
        description: t(
          'Care at home for older people, support for families and help with applying for benefits. This is an example: replace it with a real service in your area.',
          'Догляд удома для літніх людей, підтримка родин і допомога з оформленням соціальних виплат. Це приклад — замініть його справжньою службою у вашій громаді.',
        ),
        contact: 'social-services@example.org',
      },
    ],
    givingInstructions: t(
      "Thank you. Within one working day, we will e-mail you how to send your gift: a link to a secure payment page or the programme's official bank details. For goods, we will tell you which regional hub can accept them and when. We never ask for card details by phone or e-mail.",
      'Дякуємо! Протягом одного робочого дня ми надішлемо вам листа з інструкцією, як передати дар: посилання на захищену сторінку оплати або офіційні реквізити програми. Якщо ви даруєте речі, підкажемо, який регіональний хаб їх прийме і коли. Ми ніколи не просимо даних картки телефоном чи електронною поштою.',
    ),
    dropOff: [
      {
        place: t(
          'Regional hub in Kyiv, for pallets and large deliveries (we send the address when you tell us about your gift)',
          'Регіональний хаб у Києві — для палет і великих партій (адресу надішлемо, коли ви повідомите нам про дар)',
        ),
        hours: t('Monday to Saturday, 9:00–17:00, by appointment', 'З понеділка до суботи, 9:00–17:00, за попереднім записом'),
      },
      {
        place: t(
          'Regional hub in Dnipro, for help to the eastern and southern oblasts (we send the address when you tell us about your gift)',
          'Регіональний хаб у Дніпрі — для допомоги східним і південним областям (адресу надішлемо, коли ви повідомите нам про дар)',
        ),
        hours: t('Monday to Friday, 9:00–17:00, by appointment', 'З понеділка до п’ятниці, 9:00–17:00, за попереднім записом'),
      },
    ],
    partners: [
      {
        name: 'Dzherelo Humanitarian Network (fictional)', url: 'https://dzherelo.example.org',
        role: t("Partner NGO: delivers help to people's doors in Sumy, Kharkiv and Donetsk oblasts",'Партнерська громадська організація: доставляє допомогу до людей на Сумщині, Харківщині й Донеччині'),
      },
      {
        name: 'Maiak Charitable Foundation (fictional)', url: 'https://maiak.example.org',
        role: t('Partner foundation: runs warming points and a community kitchen in the south', 'Партнерський благодійний фонд: пункти обігріву й громадська кухня на півдні'),
      },
      {
        name: 'Steppe Way LLC (fictional)', url: 'https://steppe-way.example.org',
        role: t('Sponsor: covers fuel for the eastern routes', 'Спонсор: оплачує пальне для східних маршрутів'),
      },
    ],
  },

  'city-foundation': {
    label: t('City foundation', 'Міський фонд'),
    description: t(
      'Choose this for a medium-sized charitable foundation that serves one city and its oblast, with local volunteers and drop-off points in city districts.',
      'Оберіть цей профіль для благодійного фонду середнього розміру, що працює в одному місті та його області, з місцевими волонтерами й пунктами прийому в районах міста.',
    ),
    orgName: t('Warm Bridge', 'Теплий міст'),
    tagline: t('From neighbour to neighbour, in Dnipro and the oblast', 'Від сусіда до сусіда — у Дніпрі та області'),
    scope: t(
      'We help older people, families and people who have had to leave their homes, in Dnipro and across Dnipropetrovsk oblast, with food, medicines, heaters and household goods, collected at drop-off points in the city and delivered by local volunteers.',
      'Ми допомагаємо літнім людям, родинам і переселенцям у Дніпрі та по всій Дніпропетровщині продуктами, ліками, обігрівачами й речами для дому: збираємо їх у пунктах прийому по місту, а місцеві волонтери привозять просто до людей.',
    ),
    legalName: t('Warm Bridge Charitable Foundation (fictional)', 'Благодійний фонд «Теплий міст» (вигаданий)'),
    registration: t('Charitable foundation, EDRPOU code 00000000 (fictional)', 'Благодійний фонд, код ЄДРПОУ 00000000 (вигаданий)'),
    address: t('10 Example Street, Dnipro 00000, Ukraine (fictional address)', 'вул. Прикладна, 10, м. Дніпро, 00000, Україна (вигадана адреса)'),
    hours: t('Monday to Friday, 9:00–18:00; Saturday, 10:00–14:00.', 'З понеділка до п’ятниці, 9:00–18:00; у суботу, 10:00–14:00.'),
    privacyAuthority: t(
      'the data protection authority: the Ukrainian Parliament Commissioner for Human Rights',
      'орган із захисту персональних даних — Уповноважений Верховної Ради України з прав людини',
    ),
    emergency: t(
      'In danger right now? Call 112. We are not an emergency service.',
      'Вам загрожує небезпека просто зараз? Телефонуйте 112. Ми не екстрена служба.',
    ),
    channels: [
      { kind: 'phone', label: t('Call us', 'Зателефонуйте нам'), value: '+380 00 000 00 00' },
      { kind: 'viber', label: t('Write to us on Viber', 'Напишіть нам у Viber'), value: '+380 00 000 00 00' },
      { kind: 'email', label: t('E-mail', 'Електронна пошта'), value: 'hello@warm-bridge.example.org' },
    ],
    referrals: [
      {
        name: t('Example: Dnipro city social services centre', 'Приклад: міський центр соціальних послуг'),
        description: t(
          'Care at home for older people and people with disabilities, and support for families. This is an example: replace it with the real service in your city.',
          'Догляд удома для літніх людей і людей з інвалідністю, підтримка родин. Це приклад — замініть його справжньою службою вашого міста.',
        ),
        contact: '+380 00 000 00 01',
      },
      {
        name: t('Example: support centre for displaced people', 'Приклад: центр підтримки переселенців'),
        description: t(
          'Help with registration, documents and finding a place to live. This is an example: replace it with a real service in your city.',
          'Допомога з реєстрацією, документами й пошуком житла. Це приклад — замініть його справжньою службою вашого міста.',
        ),
        contact: 'idp-support@example.org',
      },
      {
        name: t('Example: free legal aid office', 'Приклад: бюро безоплатної правничої допомоги'),
        description: t(
          'Free advice on documents, housing and payments. This is an example: replace it with a real service.',
          'Безоплатні консультації щодо документів, житла й виплат. Це приклад — замініть його справжньою службою.',
        ),
        contact: '+380 00 000 00 02',
      },
    ],
    givingInstructions: t(
      'Thank you. Within a day, a coordinator will write to you with how to send your gift: a payment link or our bank details. You can bring goods to one of our drop-off points, or we will agree a time to collect them. We never ask for card details by phone or in messages.',
      'Дякуємо! Протягом дня координатор напише вам, як передати дар: надішле посилання для оплати або наші банківські реквізити. Речі можна принести в один із наших пунктів прийому — або ми домовимося, коли їх забрати. Ми ніколи не просимо даних картки телефоном чи в повідомленнях.',
    ),
    dropOff: [
      {
        place: t(
          'Chechelivskyi district: our warehouse (we send the address when you tell us about your gift)',
          'Чечелівський район: наш склад (адресу надішлемо, коли ви повідомите нам про дар)',
        ),
        hours: t('Monday to Friday, 10:00–18:00', 'З понеділка до п’ятниці, 10:00–18:00'),
      },
      {
        place: t(
          'Shevchenkivskyi district: community centre, 5 Example Avenue (fictional address)',
          'Шевченківський район: громадський центр, просп. Прикладний, 5 (вигадана адреса)',
        ),
        hours: t('Saturday, 10:00–14:00', 'Субота, 10:00–14:00'),
      },
      {
        place: t(
          'Samarskyi district: volunteer desk at the district library, 12 Sample Street (fictional address)',
          'Самарський район: стійка волонтерів у районній бібліотеці, вул. Зразкова, 12 (вигадана адреса)',
        ),
        hours: t('Wednesday, 15:00–19:00', 'Середа, 15:00–19:00'),
      },
    ],
    partners: [
      {
        name: 'Brid Volunteer Drivers (fictional)', url: 'https://brid.example.org',
        role: t('Volunteer drivers who deliver across Dnipropetrovsk oblast', 'Волонтери-водії, які доставляють допомогу по всій Дніпропетровщині'),
      },
      {
        name: 'Prystan Community Kitchen (fictional)', url: 'https://prystan.example.org',
        role: t('Cooks hot meals from the food we collect together', 'Готує гарячі обіди з продуктів, які ми збираємо разом'),
      },
    ],
  },

  'small-nationwide': {
    label: t('Small nationwide organisation', 'Невелика всеукраїнська організація'),
    description: t(
      'Choose this for a small organisation, possibly registered abroad, that works across the whole of Ukraine with a few volunteer coordinators.',
      'Оберіть цей профіль для невеликої організації (можливо, зареєстрованої за кордоном), що працює по всій Україні з кількома координаторами-волонтерами.',
    ),
    orgName: t('Open River Aid', 'Відкрита ріка'),
    tagline: t('Help flows to where it is needed', 'Допомога тече туди, де вона потрібна'),
    scope: t(
      'We help families, older people and schools in eastern and southern Ukraine with generators, warm bedding, food and hygiene kits, carried by volunteer drivers from Leeds through our Lviv hub.',
      'Ми допомагаємо родинам, літнім людям і школам на сході та півдні України генераторами, теплими ковдрами, продуктами й гігієнічними наборами, які волонтери-водії везуть з Лідса через наш хаб у Львові.',
    ),
    legalName: t('Open River Aid (fictional)', 'Open River Aid (вигадана організація)'),
    registration: t(
      'Charity registered in England and Wales, No. 0000000 (fictional, not a real registration)',
      'Благодійна організація, зареєстрована в Англії та Уельсі, № 0000000 (вигаданий номер, не справжня реєстрація)',
    ),
    address: t('1 Example Road, Leeds LS0 0AA, United Kingdom (fictional address)', '1 Example Road, Лідс, LS0 0AA, Велика Британія (вигадана адреса)'),
    hours: t(
      'Monday to Friday, 9:00–17:00 UK time. Our coordinators in Ukraine answer from 9:00 to 19:00 Kyiv time.',
      'З понеділка до п’ятниці, 9:00–17:00 за британським часом. Координатори в Україні відповідають з 9:00 до 19:00 за київським часом.',
    ),
    privacyAuthority: t(
      "the data protection authority: the Information Commissioner's Office (ICO)",
      'орган із захисту персональних даних — Офіс Уповноваженого з питань інформації Великої Британії (ICO)',
    ),
    emergency: t(
      'In danger right now? In Ukraine, call 112. In the UK, call 999. We are not an emergency service.',
      'Вам загрожує небезпека просто зараз? В Україні телефонуйте 112, у Великій Британії — 999. Ми не екстрена служба.',
    ),
    channels: [
      { kind: 'email', label: t('E-mail, in English or Ukrainian', 'Електронна пошта — українською чи англійською'), value: 'hello@openriver.example.org' },
      { kind: 'viber', label: t('Viber, our coordinators in Ukraine', 'Viber наших координаторів в Україні'), value: '+380 00 000 00 00' },
      { kind: 'phone', label: t('Phone in the UK', 'Телефон у Великій Британії'), value: '+44 0000 000000' },
    ],
    referrals: [
      {
        name: t('Example: city social services centre', 'Приклад: міський центр соціальних послуг'),
        description: t(
          'Care at home, support for families and help with benefits. This is an example: replace it with a real service where you work.',
          'Догляд удома, підтримка родин і допомога з виплатами. Це приклад — замініть його справжньою службою там, де ви працюєте.',
        ),
        contact: '+380 00 000 00 01',
      },
      {
        name: t('Example: free legal aid line', 'Приклад: лінія безоплатної правничої допомоги'),
        description: t(
          'Free advice on documents, housing and payments. This is an example: replace it with a real service.',
          'Безоплатні консультації щодо документів, житла й виплат. Це приклад — замініть його справжньою службою.',
        ),
        contact: '+380 00 000 00 02',
      },
    ],
    givingInstructions: t(
      'Thank you. Within two working days, a coordinator will e-mail you how to send your gift: a link to a secure card payment page or our bank details. For goods, we will tell you when to bring them to our Leeds collection point. We never ask for card details by e-mail or phone.',
      'Дякуємо! Протягом двох робочих днів координатор надішле вам листа з інструкцією, як передати дар: посилання на захищену сторінку оплати карткою або наші банківські реквізити. Якщо ви даруєте речі, підкажемо, коли принести їх до нашого пункту збору в Лідсі. Ми ніколи не просимо даних картки електронною поштою чи телефоном.',
    ),
    dropOff: [
      {
        place: t(
          'Leeds collection point (we send the address when you tell us about your gift)',
          'Пункт збору в Лідсі (адресу надішлемо, коли ви повідомите нам про дар)',
        ),
        hours: t('Every other Saturday, 10:00–13:00, before each van run', 'Кожної другої суботи, 10:00–13:00, перед кожним рейсом буса'),
      },
      {
        place: t(
          'Lviv hub, for goods given in Ukraine (we send the address when you tell us about your gift)',
          'Хаб у Львові — для речей, переданих в Україні (адресу надішлемо, коли ви повідомите нам про дар)',
        ),
        hours: t('Monday to Friday, 10:00–17:00, by appointment', 'З понеділка до п’ятниці, 10:00–17:00, за домовленістю'),
      },
    ],
    partners: [
      {
        name: 'Kryla Community Foundation (fictional)', url: 'https://kryla.example.org',
        role: t('Runs our partner hub in Dnipro', 'Керує партнерським хабом у Дніпрі'),
      },
      {
        name: 'Sumy Volunteer Hub (fictional)', url: 'https://sumy-hub.example.org',
        role: t('Carries help from Lviv to communities in Sumy oblast', 'Доставляє допомогу зі Львова до громад Сумщини'),
      },
    ],
  },
};
