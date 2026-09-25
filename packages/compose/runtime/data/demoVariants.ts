import type { DemoVariant } from '../types/DemoVariant.ts';
import type { ProfileId } from '@river/settings';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/**
 * The demo data of each profile (spec: 10-demo-content). Everything is fictional. The
 * 'small-nationwide' variant reproduces the original seed exactly; the two Ukrainian variants use
 * hryvnias (base gifts in pounds × 250 for the national programme, × 50 for the city foundation),
 * Ukrainian givers and routes that stay inside Ukraine. Amounts keep delivery costs at a credible
 * share of money received, because the home page shows that share as a sign of trust.
 */
export const demoVariants: Record<ProfileId, DemoVariant> = {
  'state-programme': {
    profileId: 'state-programme',
    currency: 'UAH',
    amountFactor: 250,
    personaNames: {
      olena: t('Olena', 'Олена'),
      james: t('Dmytro', 'Дмитро'),
      harbour: t('Steppe Way LLC', 'ТОВ «Степовий шлях»'),
      mykola: t('Mykola', 'Микола'),
      andriy: t('Andriy', 'Андрій'),
      helen: t('Larysa', 'Лариса'),
      sofia: t('Sofia', 'Софія'),
      iryna: t('Iryna', 'Ірина'),
      priya: t('Viktor', 'Віктор'),
    },
    campaigns: {
      fuel: {
        slug: 'fuel-for-the-eastern-routes',
        title: t('Fuel for the eastern routes', 'Пальне для східних маршрутів'),
        summary: t(
          'Every week, lorries leave the Kyiv regional hub for communities in Kharkiv, Sumy and Donetsk oblasts. Your gift pays for their diesel — and you will see every receipt.',
          'Щотижня з регіонального хабу в Києві вирушають вантажівки до громад Харківщини, Сумщини й Донеччини. Ваш дар оплачує пальне — і ви побачите кожен чек.',
        ),
        goalMajor: 600_000,
      },
      winter: {
        slug: 'heat-and-light-for-frontline-communities',
        title: t('Heat and light for frontline communities', 'Тепло і світло для прифронтових громад'),
        summary: t(
          'Generators, heaters and power banks for families, schools and warming points in frontline communities, delivered through our regional hubs and partner NGOs.',
          'Генератори, обігрівачі й павербанки для родин, шкіл і пунктів обігріву в прифронтових громадах — через наші регіональні хаби та партнерські організації.',
        ),
        goalMajor: 1_500_000,
      },
    },
    givers: [
      { name: 'Дмитро Савчук', email: 'dmytro@example.org' },
      { name: 'ТОВ «Степовий шлях»', email: 'steppe-way@example.com' },
      { name: 'Анна Кравець', email: 'anna@example.org' },
      { name: 'Петро Лисенко', email: 'petro@example.org' },
      { name: 'Мирослава Гуменюк', email: 'myroslava@example.org' },
      { name: 'Олег Ткаченко', email: 'oleh@example.org' },
      { name: 'Юрій Данильченко', email: 'yurii@example.org' },
      { name: 'Христина Павлюк', email: 'khrystyna@example.org' },
      { name: 'Агрокооператив «Світанок»', email: 'svitanok@example.org' },
      { name: 'Богдана Мельничук', email: 'bohdana@example.org' },
    ],
    goods: {
      generator: { description: '3 kW petrol generator, new, boxed, handed in at the Kyiv regional hub', giver: 'Сергій Литвиненко', email: 'serhii@example.org' },
      food: { description: '6 food parcels (tinned meat, buckwheat, tea), packed at the Dnipro regional hub', giver: 'Парафія святого Миколая', email: 'parish@example.org' },
      transport: { description: 'Space in a van, Kyiv → Dnipro, twice a month', giver: 'Володимир', email: 'v@example.org' },
    },
    routes: { flow1From: 'Kyiv regional hub', flow2From: 'Dnipro regional hub', flow2Carrier: 'Dzherelo Humanitarian Network' },
    costs1: [
      // Above the programme's approval limit (UAH 50,000): waits for the Finance Steward.
      { kind: 'fuel', amountMinor: 6_120_000, currency: 'UAH', note: 'Diesel for three lorries, Kyiv regional hub → Kharkiv oblast and back' },
      { kind: 'vehicle', amountMinor: 900_000, currency: 'UAH', note: 'Van hire for deliveries to villages in Kharkiv oblast, 2 days' },
      { kind: 'packaging', amountMinor: 864_000, currency: 'UAH', note: 'Pallets, stretch film and boxes for 18 pallets' },
    ],
    costs2: [
      { kind: 'fuel', amountMinor: 612_000, currency: 'UAH', note: 'Diesel for the partner van, Dnipro regional hub → Sumy oblast and back' },
      { kind: 'packaging', amountMinor: 54_000, currency: 'UAH', note: 'Boxes and tape for six food parcels' },
    ],
    // A national programme serves every oblast: the needs keep their places.
    needOverrides: [{}, {}, {}, {}, {}],
    recipientThanks: 'Дякуємо всім, хто привіз цей генератор аж із Києва. Тепер онук робить уроки при світлі, а ліки в холоді. Ви повернули нам спокій.',
    milestone: t(
      'The Svitanok farming cooperative gave ₴112,500 from its harvest fund to Heat and light for frontline communities. Thank you — the first heaters are on their way.',
      'Агрокооператив «Світанок» передав 112 500 грн зі свого фонду врожаю на «Тепло і світло для прифронтових громад». Дякуємо — перші обігрівачі вже в дорозі.',
    ),
  },

  'city-foundation': {
    profileId: 'city-foundation',
    currency: 'UAH',
    amountFactor: 50,
    personaNames: {
      olena: t('Olena', 'Олена'),
      james: t('Taras', 'Тарас'),
      harbour: t('Right Bank Print LLC', 'ТОВ «Правобережна друкарня»'),
      mykola: t('Mykola', 'Микола'),
      andriy: t('Andriy', 'Андрій'),
      helen: t('Hanna', 'Ганна'),
      sofia: t('Sofia', 'Софія'),
      iryna: t('Iryna', 'Ірина'),
      priya: t('Bohdan', 'Богдан'),
    },
    campaigns: {
      fuel: {
        slug: 'fuel-for-our-volunteer-drivers',
        title: t('Fuel for our volunteer drivers', 'Пальне для наших волонтерів-водіїв'),
        summary: t(
          'Our volunteer drivers take food, medicines and generators from the Dnipro warehouse to villages across the oblast. Your gift pays for their diesel — and you will see every receipt.',
          'Наші волонтери-водії возять продукти, ліки й генератори зі складу в Дніпрі до сіл по всій області. Ваш дар оплачує пальне — і ви побачите кожен чек.',
        ),
        goalMajor: 120_000,
      },
      winter: {
        slug: 'warm-homes-in-dnipro-this-winter',
        title: t('Warm homes in Dnipro this winter', 'Теплі домівки Дніпра цієї зими'),
        summary: t(
          'Heaters, power banks and warm blankets for older people, families and schools in Dnipro and nearby villages, chosen by the people who will use them.',
          'Обігрівачі, павербанки й теплі ковдри для літніх людей, родин і шкіл у Дніпрі та навколишніх селах — саме те, що обрали люди, які ними користуватимуться.',
        ),
        goalMajor: 300_000,
      },
    },
    givers: [
      { name: 'Тарас Мельник', email: 'taras@example.org' },
      { name: 'ТОВ «Правобережна друкарня»', email: 'right-bank-print@example.com' },
      { name: 'Світлана Бойко', email: 'svitlana@example.org' },
      { name: 'Артем Кузьменко', email: 'artem@example.org' },
      { name: 'Вікторія Остапенко', email: 'viktoriia@example.org' },
      { name: 'Максим Гончар', email: 'maksym@example.org' },
      { name: 'Людмила Сидоренко', email: 'liudmyla@example.org' },
      { name: 'Роман Власенко', email: 'roman@example.org' },
      { name: 'Біговий клуб «Дніпровська хвиля»', email: 'run-club@example.org' },
      { name: 'Олександра Бондаренко', email: 'oleksandra@example.org' },
    ],
    goods: {
      generator: { description: '3 kW petrol generator, new, boxed, brought to our drop-off point in Dnipro', giver: 'Віталій Руденко', email: 'vitalii@example.org' },
      food: { description: '6 food parcels (tinned food, buckwheat, tea), packed by neighbours on the left bank', giver: 'Сусідська спільнота «Лівий берег»', email: 'neighbours@example.org' },
      transport: { description: 'Space in a car, Dnipro → Kamianske and back, on Saturdays', giver: 'Олексій', email: 'o@example.org' },
    },
    routes: { flow1From: 'Dnipro warehouse', flow2From: 'Dnipro warehouse', flow2Carrier: 'Brid volunteer drivers' },
    costs1: [
      { kind: 'fuel', amountMinor: 186_000, currency: 'UAH', note: 'Diesel, Dnipro warehouse → south of the oblast and back' },
      // Above the foundation's approval limit (UAH 10,000): waits for the Finance Steward.
      { kind: 'vehicle', amountMinor: 1_200_000, currency: 'UAH', note: 'Van hire, 4 days, while our own van is being repaired' },
      { kind: 'packaging', amountMinor: 96_000, currency: 'UAH', note: 'Boxes, tape and stretch film' },
    ],
    costs2: [
      { kind: 'fuel', amountMinor: 124_000, currency: 'UAH', note: 'Diesel for a volunteer car, Dnipro warehouse → villages south of the city and back' },
    ],
    // A city foundation serves Dnipro and its oblast; settlements are in the language of each need.
    needOverrides: [
      { oblastId: 'dnipropetrovsk', settlement: 'Марганець' },
      { oblastId: 'dnipropetrovsk', settlement: 'Tomakivka' },
      { oblastId: 'dnipropetrovsk', settlement: 'Нікополь' },
      { oblastId: 'dnipropetrovsk', settlement: 'Дніпро' },
      { oblastId: 'dnipropetrovsk', settlement: 'Dnipro' },
    ],
    recipientThanks: 'Дякуємо всім, хто привіз нам цей генератор. Тепер онук робить уроки при світлі, а ліки в холоді. Ви повернули нам спокій.',
    milestone: t(
      'The Dnipro Wave running club held a charity run and gave ₴22,500 to Warm homes in Dnipro this winter. Thank you — the first heaters are on their way.',
      'Біговий клуб «Дніпровська хвиля» провів благодійний забіг і передав 22 500 грн на «Теплі домівки Дніпра цієї зими». Дякуємо — перші обігрівачі вже в дорозі.',
    ),
  },

  'small-nationwide': {
    profileId: 'small-nationwide',
    currency: 'GBP',
    amountFactor: 1,
    personaNames: {
      olena: t('Olena', 'Олена'),
      james: t('James', 'James'),
      harbour: t('Harbour Print Ltd', 'Harbour Print Ltd'),
      mykola: t('Mykola', 'Микола'),
      andriy: t('Andriy', 'Андрій'),
      helen: t('Helen', 'Helen'),
      sofia: t('Sofia', 'Софія'),
      iryna: t('Iryna', 'Ірина'),
      priya: t('Priya', 'Priya'),
    },
    campaigns: {
      fuel: {
        slug: 'fuel-for-the-kharkiv-run',
        title: t('Fuel for the Kharkiv run', 'Пальне для харківського рейсу'),
        summary: t(
          'One van, one driver, 2,300 km from Leeds to Kharkiv oblast. Your gift covers fuel, the ferry and road tolls — and you will see every receipt.',
          'Один бус, один водій, 2 300 км від Лідса до Харківщини. Ваш дар покриває пальне, пором і платні дороги — і ви побачите кожен чек.',
        ),
        goalMajor: 2_400,
      },
      winter: {
        slug: 'warm-homes-this-winter',
        title: t('Warm homes this winter', 'Теплі домівки цієї зими'),
        summary: t(
          'Generators, power banks and heaters for families and schools near the front line, chosen by the people who will use them.',
          'Генератори, павербанки й обігрівачі для родин і шкіл біля лінії фронту — саме те, що обрали люди, які ними користуватимуться.',
        ),
        goalMajor: 6_000,
      },
    },
    givers: [
      { name: 'James Hart', email: 'james@example.org' },
      { name: 'Harbour Print Ltd', email: 'sarah@harbourprint.example' },
      { name: 'Aisha Rahman', email: 'aisha@example.org' },
      { name: 'Tom Price', email: 'tom@example.org' },
      { name: 'Ірина Коваль', email: 'iryna@example.org' },
      { name: 'Grace Lee', email: 'grace@example.org' },
      { name: 'Oliver Byrne', email: 'oliver@example.org' },
      { name: 'Марта Шевчук', email: 'marta@example.org' },
      { name: 'Leeds Community Choir', email: 'choir@example.org' },
      { name: 'Daniel Owusu', email: 'daniel@example.org' },
    ],
    goods: {
      generator: { description: '3 kW petrol generator, new, boxed', giver: 'Peter Walsh', email: 'peter@example.org' },
      food: { description: '6 food parcels (tinned food, grains, tea)', giver: 'St Mary Parish', email: 'parish@example.org' },
      transport: { description: 'Van space Lviv → Dnipro, second week of the month', giver: 'Mykhailo', email: 'm@example.org' },
    },
    routes: { flow1From: 'Leeds', flow2From: 'Lviv hub', flow2Carrier: 'Sumy volunteer hub' },
    costs1: [
      { kind: 'fuel', amountMinor: 1_260_000, currency: 'UAH', note: 'Diesel, Lviv → Kharkiv oblast and back' },
      { kind: 'fuel', amountMinor: 18_640, currency: 'GBP', note: 'Diesel, Leeds → Dover and Calais → Lviv' },
      { kind: 'ferry', amountMinor: 31_000, currency: 'GBP', note: 'Dover–Calais, van and driver, return' },
      { kind: 'tolls', amountMinor: 8_950, currency: 'EUR', note: 'German and Polish road tolls' },
    ],
    costs2: [
      { kind: 'fuel', amountMinor: 420_000, currency: 'UAH', note: 'Lviv → Sumy oblast' },
    ],
    needOverrides: [{}, {}, {}, {}, {}],
    recipientThanks: 'Дякуємо всім, хто віз цей генератор через пів Європи. Тепер онук робить уроки при світлі, а ліки в холоді. Ви повернули нам спокій.',
    milestone: t(
      'The Leeds Community Choir sang for an evening and gave £450 to Warm homes this winter. Thank you — the first heaters are on their way.',
      'Громадський хор Лідса співав цілий вечір і передав £450 на «Теплі домівки цієї зими». Дякуємо — перші обігрівачі вже в дорозі.',
    ),
  },
};
