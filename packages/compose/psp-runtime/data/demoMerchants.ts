import type { LocalisedText } from '@river/i18n';
import type { Channel, InstrumentId } from '@river/psp-facts';

export type Product = { sku: string; title: LocalisedText; minMinor: number; maxMinor: number; sellerUnitId: string | null };

/**
 * How a demo merchant trades: where its orders come from (the selling units and their channel), how many
 * a day, what it sells, which instruments its payers prefer, and how its payers behave.
 */
export type MerchantPlan = {
  merchantId: string;
  sellingUnits: ReadonlyArray<{ unitId: string; channel: Channel; share: number }>;
  perDay: number;
  weekend: number;
  lines: [number, number];
  products: readonly Product[];
  mix: Partial<Record<InstrumentId, number>>;
  payerPool: number;
  foreignCards: number;
  invoiceFirst: boolean;
  goods: boolean;
};

const t = (en: string, uk: string): LocalisedText => ({ 'en-GB': en, uk });
const pr = (sku: string, en: string, uk: string, min: number, max: number, sellerUnitId: string | null = null): Product => ({ sku, title: t(en, uk), minMinor: min * 100, maxMinor: max * 100, sellerUnitId });

/** The demo merchants' trade. Prices are in the merchant's currency (UAH in Ukraine, EUR in Europe). */
export const demoMerchants: readonly MerchantPlan[] = [
  { merchantId: 'ou-kvitka-market', perDay: 9, weekend: 1.25, lines: [1, 4], payerPool: 900, foreignCards: 0.03, invoiceFirst: false, goods: true,
    sellingUnits: [{ unitId: 'ou-kvitka-web', channel: 'web', share: 0.62 }, { unitId: 'ou-kvitka-app', channel: 'app', share: 0.38 }],
    products: [
      pr('HNY-ACACIA', 'Acacia honey, 1 kg', 'Мед акацієвий, 1 кг', 380, 520, 'ou-seller-honey'),
      pr('HNY-BUCK', 'Buckwheat honey, 0.5 kg', 'Мед гречаний, 0,5 кг', 210, 290, 'ou-seller-honey'),
      pr('HNY-COMB', 'Honeycomb frame', 'Стільниковий мед, рамка', 640, 900, 'ou-seller-honey'),
      pr('CER-JUG', 'Glazed jug, Opishnia', 'Глечик поливаний, Опішня', 950, 2_400, 'ou-seller-ceramics'),
      pr('CER-TOY', 'Clay whistle toy', 'Глиняна свищик-іграшка', 180, 420, 'ou-seller-ceramics'),
      pr('CER-SET', 'Tea set for six', 'Чайний сервіз на шість осіб', 2_800, 4_600, 'ou-seller-ceramics'),
      pr('BAK-KOLACH', 'Festive kolach', 'Святковий калач', 160, 320, 'ou-seller-bakery'),
      pr('BAK-BOX', 'Box of Lviv pastries', 'Набір львівської випічки', 380, 690, 'ou-seller-bakery'),
      pr('KVM-TOWEL', 'Linen towel', 'Лляний рушник', 420, 760),
      pr('KVM-CANDLE', 'Beeswax candle', 'Свічка з вощини', 150, 260),
    ],
    mix: { card: 44, apple_pay: 14, google_pay: 12, installments: 8, qr_nbu: 8, pay_by_bank: 8, voucher: 4, bank_transfer: 2 } },
  { merchantId: 'ou-kvitka-pharmacy', perDay: 8, weekend: 0.85, lines: [1, 3], payerPool: 1_400, foreignCards: 0.02, invoiceFirst: false, goods: false,
    sellingUnits: [{ unitId: 'ou-pharmacy-podil', channel: 'pos', share: 0.55 }, { unitId: 'ou-pharmacy-rynok', channel: 'pos', share: 0.45 }],
    products: [
      pr('PH-VITD', 'Vitamin D3, 60 capsules', 'Вітамін D3, 60 капсул', 240, 410),
      pr('PH-COLD', 'Cold and flu remedy', 'Засіб від застуди та грипу', 110, 280),
      pr('PH-PROB', 'Probiotic, 30 days', 'Пробіотик, 30 днів', 390, 720),
      pr('PH-BP', 'Blood pressure monitor', 'Тонометр', 1_200, 2_100),
      pr('PH-CREAM', 'Dermatological cream', 'Дерматологічний крем', 180, 460),
    ],
    mix: { card: 52, apple_pay: 21, google_pay: 19, qr_nbu: 8 } },
  { merchantId: 'ou-dnipro-travel', perDay: 1.6, weekend: 1.1, lines: [2, 3], payerPool: 220, foreignCards: 0.06, invoiceFirst: true, goods: false,
    sellingUnits: [{ unitId: 'ou-dnipro-travel-web', channel: 'web', share: 0.7 }, { unitId: 'ou-dnipro-travel', channel: 'invoice', share: 0.3 }],
    products: [
      pr('TR-HOTEL-3N', 'Three nights by the sea', 'Три ночі біля моря', 7_800, 16_500, 'ou-supplier-hotel'),
      pr('TR-HOTEL-7N', 'A week by the sea', 'Тиждень біля моря', 18_000, 39_000, 'ou-supplier-hotel'),
      pr('TR-COACH', 'Coach transfer, return', 'Трансфер автобусом, туди й назад', 1_400, 3_200, 'ou-supplier-coach'),
      pr('TR-GUIDE', 'Guided excursions', 'Екскурсії з гідом', 900, 2_600),
    ],
    mix: { card: 40, installments: 24, bank_transfer: 18, pay_by_bank: 12, apple_pay: 6 } },
  { merchantId: 'ou-open-river', perDay: 2.2, weekend: 1.4, lines: [1, 1], payerPool: 600, foreignCards: 0.12, invoiceFirst: false, goods: false,
    sellingUnits: [{ unitId: 'ou-open-river', channel: 'link', share: 1 }],
    products: [
      pr('GIFT-FOOD', 'Food parcel for a family', 'Продуктовий набір для родини', 300, 1_200),
      pr('GIFT-MED', 'Medicines for the left bank', 'Ліки для лівого берега', 500, 3_000),
      pr('GIFT-ANY', 'Where it is needed most', 'Туди, де найпотрібніше', 100, 5_000),
    ],
    mix: { card: 48, apple_pay: 12, google_pay: 10, qr_nbu: 16, bank_transfer: 14 } },
  { merchantId: 'ou-zerno-if', perDay: 6, weekend: 1.5, lines: [1, 3], payerPool: 700, foreignCards: 0.04, invoiceFirst: false, goods: false,
    sellingUnits: [{ unitId: 'ou-zerno-if', channel: 'pos', share: 1 }],
    products: [pr('ZR-FLAT', 'Flat white', 'Флет вайт', 70, 95), pr('ZR-CROIS', 'Croissant', 'Круасан', 55, 85), pr('ZR-BEANS', 'Coffee beans, 250 g', 'Кава в зернах, 250 г', 290, 420)],
    mix: { card: 46, apple_pay: 27, google_pay: 21, qr_nbu: 6 } },
  { merchantId: 'ou-zerno-uzh', perDay: 4, weekend: 1.6, lines: [1, 3], payerPool: 500, foreignCards: 0.07, invoiceFirst: false, goods: false,
    sellingUnits: [{ unitId: 'ou-zerno-uzh', channel: 'pos', share: 1 }],
    products: [pr('ZR-LATTE', 'Latte', 'Лате', 75, 100), pr('ZR-CAKE', 'Cake of the day', 'Тістечко дня', 85, 130), pr('ZR-BEANS', 'Coffee beans, 250 g', 'Кава в зернах, 250 г', 290, 420)],
    mix: { card: 44, apple_pay: 26, google_pay: 24, qr_nbu: 6 } },
  { merchantId: 'ou-krok', perDay: 1.4, weekend: 0.6, lines: [1, 1], payerPool: 300, foreignCards: 0.05, invoiceFirst: true, goods: false,
    sellingUnits: [{ unitId: 'ou-krok', channel: 'invoice', share: 1 }],
    products: [pr('KR-PY', 'Python course, 3 months', 'Курс Python, 3 місяці', 4_800, 9_800), pr('KR-EN', 'English, a term', 'Англійська, семестр', 2_400, 5_600), pr('KR-UX', 'UX design intensive', 'Інтенсив з UX-дизайну', 6_500, 12_000)],
    mix: { card: 42, installments: 26, pay_by_bank: 16, bank_transfer: 12, apple_pay: 4 } },
  { merchantId: 'ou-baltic-bikes', perDay: 2.4, weekend: 1.3, lines: [1, 3], payerPool: 260, foreignCards: 0.09, invoiceFirst: false, goods: true,
    sellingUnits: [{ unitId: 'ou-baltic-bikes-web', channel: 'web', share: 1 }],
    products: [pr('BB-GRAVEL', 'Gravel bike', 'Гравійний велосипед', 1_150, 2_900), pr('BB-CITY', 'City bike', 'Міський велосипед', 480, 980), pr('BB-HELMET', 'Helmet', 'Шолом', 45, 160), pr('BB-LIGHTS', 'Light set', 'Комплект ліхтарів', 25, 90)],
    mix: { card: 48, apple_pay: 14, google_pay: 10, bnpl: 16, pay_by_bank: 12 } },
  { merchantId: 'ou-nordlicht', perDay: 1.5, weekend: 0.3, lines: [1, 2], payerPool: 120, foreignCards: 0.1, invoiceFirst: true, goods: false,
    sellingUnits: [{ unitId: 'ou-nordlicht', channel: 'subscription', share: 0.65 }, { unitId: 'ou-nordlicht', channel: 'invoice', share: 0.35 }],
    products: [pr('NL-TEAM', 'Team plan, monthly', 'Тарифний план «Команда», місяць', 49, 290), pr('NL-ENT', 'Enterprise plan, annual', 'План «Підприємство», рік', 1_800, 6_900), pr('NL-SEAT', 'Extra seats', 'Додаткові місця', 12, 120)],
    mix: { card: 38, direct_debit: 32, bank_transfer: 20, wallet: 10 } },
  { merchantId: 'ou-amber', perDay: 1.2, weekend: 1.4, lines: [1, 2], payerPool: 160, foreignCards: 0.22, invoiceFirst: false, goods: true,
    sellingUnits: [{ unitId: 'ou-amber', channel: 'web', share: 1 }],
    products: [pr('AM-RING', 'Silver ring with amber', 'Срібний перстень з бурштином', 85, 340), pr('AM-NECK', 'Amber necklace', 'Бурштинове намисто', 240, 1_600), pr('AM-SET', 'Jewellery set', 'Ювелірний комплект', 900, 3_800)],
    mix: { card: 52, wallet: 18, apple_pay: 16, stablecoin: 14 } },
];
