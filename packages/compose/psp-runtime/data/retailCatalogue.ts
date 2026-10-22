import type { LocalisedText } from '@river/i18n';

export type GroceryProduct = { sku: string; title: LocalisedText; minMinor: number; maxMinor: number; weighed: boolean };

const p = (sku: string, en: string, uk: string, min: number, max: number, weighed = false): GroceryProduct => ({ sku, title: { 'en-GB': en, uk }, minMinor: min * 100, maxMinor: max * 100, weighed });

/** What the group's online shop sells, with prices in UAH. Weighed goods are charged by their picked weight. */
export const groceryProducts: readonly GroceryProduct[] = [
  p('BRD-RYE', 'Rye bread', 'Хліб житній', 32, 48), p('MLK-25', 'Milk 2.5 %, 900 g', 'Молоко 2,5 %, 900 г', 38, 62), p('EGG-10', 'Eggs, 10', 'Яйця, 10 шт.', 52, 78),
  p('CHS-HARD', 'Hard cheese', 'Сир твердий', 160, 420, true), p('CHK-FIL', 'Chicken fillet', 'Філе куряче', 180, 260, true), p('APL-KG', 'Apples', 'Яблука', 28, 48, true),
  p('BAN-KG', 'Bananas', 'Банани', 52, 68, true), p('COF-BEAN', 'Coffee beans, 1 kg', 'Кава в зернах, 1 кг', 420, 860), p('DET-LIQ', 'Laundry detergent', 'Засіб для прання', 140, 380),
  p('BBY-PUR', 'Baby purée', 'Дитяче пюре', 40, 90), p('WIN-RED', 'Red wine', 'Вино червоне', 220, 690), p('CHO-DRK', 'Dark chocolate', 'Шоколад чорний', 45, 120),
  p('PST-500', 'Pasta, 500 g', 'Макарони, 500 г', 38, 80), p('OIL-SUN', 'Sunflower oil, 1 l', 'Олія соняшникова, 1 л', 68, 98), p('BCK-1KG', 'Buckwheat, 1 kg', 'Гречка, 1 кг', 52, 74),
  p('WTR-6', 'Water, six bottles', 'Вода, шість пляшок', 90, 140), p('POT-KG', 'Potatoes', 'Картопля', 18, 32, true), p('TOM-KG', 'Tomatoes', 'Помідори', 60, 140, true),
  p('FSH-SAL', 'Salmon steak', 'Стейк лосося', 300, 640, true), p('DPR-L', 'Nappies, size 4', 'Підгузки, розмір 4', 380, 790), p('PET-DRY', 'Dry pet food', 'Сухий корм для тварин', 120, 420),
  p('YOG-GR', 'Greek yoghurt', 'Йогурт грецький', 42, 76), p('SAU-CUR', 'Cured sausage', 'Ковбаса сирокопчена', 140, 360, true), p('JCE-1L', 'Orange juice, 1 l', 'Сік апельсиновий, 1 л', 62, 110),
  p('TEA-100', 'Black tea, 100 bags', 'Чай чорний, 100 пакетиків', 95, 210), p('CUC-KG', 'Cucumbers', 'Огірки', 40, 120, true), p('SHP-400', 'Shampoo', 'Шампунь', 110, 290),
  p('ICE-CRM', 'Ice cream', 'Морозиво', 35, 95), p('BTR-200', 'Butter, 200 g', 'Масло вершкове, 200 г', 82, 128), p('GRP-KG', 'Grapes', 'Виноград', 90, 180, true),
];

/** Corporate orders of the group: gift certificates and catering for offices, invoiced with payment terms. */
export const corporateProducts: readonly GroceryProduct[] = [
  p('GFT-1000', 'Gift certificate UAH 1,000', 'Подарунковий сертифікат 1 000 ₴', 1_000, 1_000), p('GFT-500', 'Gift certificate UAH 500', 'Подарунковий сертифікат 500 ₴', 500, 500),
  p('CAT-OFF', 'Office catering set', 'Кейтеринг-сет для офісу', 4_800, 12_600), p('BOX-NY', 'Holiday gift box', 'Святковий подарунковий набір', 890, 1_650),
];
