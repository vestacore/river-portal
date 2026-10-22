import type { Unit } from '@river/psp-units';

const u = (id: string, parentId: string | null, kind: Unit['kind'], en: string, uk: string, extra: Partial<Unit> = {}): Unit => ({
  id, parentId, kind, name: { 'en-GB': en, uk }, code: id.replace(/^rt-/, '').toUpperCase(), country: 'UA', currency: 'UAH',
  status: 'active', blockInheritance: false, mcc: null, channel: null, createdAt: '2024-02-01T09:00:00.000Z', ...extra,
});
const store = (id: string, region: string, en: string, uk: string) => u(id, region, 'store', en, uk, { mcc: '5411', channel: 'pos' });

/**
 * The retail stand's hierarchy: a group of companies with a legal entity for its stores and one for its
 * online trade. The stores sit in four regions; online trade has a web shop, an app, payment on delivery
 * by QR, and corporate orders by invoice. Every name and address is invented.
 */
export const retailUnits: readonly Unit[] = [
  u('rt-group', null, 'holding', 'Yarmarok Retail Group', 'Роздрібна група «Ярмарок»', { code: 'YRG', createdAt: '2019-03-01T09:00:00.000Z' }),
  u('rt-retail', 'rt-group', 'merchant', 'Yarmarok Retail', 'Ярмарок Рітейл', { code: 'YRR', mcc: '5411', createdAt: '2019-03-01T09:00:00.000Z' }),
  u('rt-kyiv', 'rt-retail', 'region', 'Kyiv and region', 'Київ і область', { code: 'KYIV' }),
  store('rt-kyiv-1', 'rt-kyiv', 'Yarmarok Hyper · Kyiv, Peremohy Ave', 'Ярмарок Гіпер · Київ, просп. Перемоги'),
  store('rt-kyiv-2', 'rt-kyiv', 'Yarmarok · Kyiv, Obolon', 'Ярмарок · Київ, Оболонь'),
  store('rt-kyiv-3', 'rt-kyiv', 'Yarmarok · Kyiv, Pozniaky', 'Ярмарок · Київ, Позняки'),
  store('rt-kyiv-4', 'rt-kyiv', 'Yarmarok Poruch · Kyiv, Podil', 'Ярмарок Поруч · Київ, Поділ'),
  store('rt-kyiv-5', 'rt-kyiv', 'Yarmarok · Brovary', 'Ярмарок · Бровари'),
  u('rt-west', 'rt-retail', 'region', 'West', 'Захід', { code: 'WEST' }),
  store('rt-west-1', 'rt-west', 'Yarmarok Hyper · Lviv, Stryiska St', 'Ярмарок Гіпер · Львів, вул. Стрийська'),
  store('rt-west-2', 'rt-west', 'Yarmarok · Lviv, Sykhiv', 'Ярмарок · Львів, Сихів'),
  store('rt-west-3', 'rt-west', 'Yarmarok · Ivano-Frankivsk', 'Ярмарок · Івано-Франківськ'),
  store('rt-west-4', 'rt-west', 'Yarmarok Poruch · Ternopil', 'Ярмарок Поруч · Тернопіль'),
  store('rt-west-5', 'rt-west', 'Yarmarok · Lutsk', 'Ярмарок · Луцьк'),
  u('rt-east', 'rt-retail', 'region', 'East', 'Схід', { code: 'EAST' }),
  store('rt-east-1', 'rt-east', 'Yarmarok Hyper · Kharkiv, Nauky Ave', 'Ярмарок Гіпер · Харків, просп. Науки'),
  store('rt-east-2', 'rt-east', 'Yarmarok · Dnipro, Yavornytskoho Ave', 'Ярмарок · Дніпро, просп. Яворницького'),
  store('rt-east-3', 'rt-east', 'Yarmarok · Zaporizhzhia', 'Ярмарок · Запоріжжя'),
  store('rt-east-4', 'rt-east', 'Yarmarok Poruch · Poltava', 'Ярмарок Поруч · Полтава'),
  store('rt-east-5', 'rt-east', 'Yarmarok · Kharkiv, Saltivka', 'Ярмарок · Харків, Салтівка'),
  u('rt-south', 'rt-retail', 'region', 'Centre and south', 'Центр і південь', { code: 'SOUTH' }),
  store('rt-south-1', 'rt-south', 'Yarmarok Hyper · Odesa, Fontanska Rd', 'Ярмарок Гіпер · Одеса, Фонтанська дорога'),
  store('rt-south-2', 'rt-south', 'Yarmarok · Vinnytsia', 'Ярмарок · Вінниця'),
  store('rt-south-3', 'rt-south', 'Yarmarok · Mykolaiv', 'Ярмарок · Миколаїв'),
  store('rt-south-4', 'rt-south', 'Yarmarok Poruch · Cherkasy', 'Ярмарок Поруч · Черкаси'),
  store('rt-south-5', 'rt-south', 'Yarmarok · Odesa, Tairova', 'Ярмарок · Одеса, Таїрова'),
  u('rt-online', 'rt-group', 'merchant', 'Yarmarok Online', 'Ярмарок Онлайн', { code: 'YRO', mcc: '5411', createdAt: '2021-05-01T09:00:00.000Z' }),
  u('rt-web', 'rt-online', 'store', 'yarmarok.example', 'yarmarok.example', { code: 'YRO-WEB', mcc: '5411', channel: 'web' }),
  u('rt-app', 'rt-online', 'store', 'Yarmarok app', 'Застосунок «Ярмарок»', { code: 'YRO-APP', mcc: '5411', channel: 'app' }),
  u('rt-door', 'rt-online', 'store', 'Pay on delivery (QR)', 'Оплата при отриманні (QR)', { code: 'YRO-DOOR', mcc: '5411', channel: 'link' }),
  u('rt-b2b', 'rt-online', 'store', 'Corporate orders', 'Корпоративні замовлення', { code: 'YRO-B2B', mcc: '5411', channel: 'invoice' }),
];
