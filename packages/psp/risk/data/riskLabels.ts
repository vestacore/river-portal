import type { LocalisedText } from '@river/i18n';
import type { AlertKind, AlertStatus, Condition, KybCheck, RiskReason } from '../types/Risk.ts';

const t = (en: string, uk: string): LocalisedText => ({ 'en-GB': en, uk });

export const riskReasonLabels: Record<RiskReason, LocalisedText> = {
  amount_spike: t('Amount far above the merchant’s usual', 'Сума значно вища за звичну для мерчанта'),
  velocity: t('Many attempts by one payer in 24 hours', 'Багато спроб одного платника за добу'),
  country_mismatch: t('Card issued in another country than the payer is in', 'Картку видано в іншій країні, ніж перебуває платник'),
  blocked_country: t('A blocked country', 'Заблокована країна'),
  new_payer: t('A payer seen for the first time', 'Платник уперше'),
  night_time: t('At night, local time', 'Вночі за місцевим часом'),
  high_risk_mcc: t('A high-risk kind of business', 'Високоризиковий вид діяльності'),
  crypto: t('Paid with crypto-assets', 'Оплата криптоактивами'),
  threshold: t('At or above the reporting threshold', 'На рівні чи вище порогу звітування'),
  structuring: t('Several payments just below the threshold', 'Кілька платежів трохи нижче порогу'),
  rule: t('A unit’s rule matched', 'Спрацювало правило одиниці'),
};

export const alertKindLabels: Record<AlertKind, LocalisedText> = {
  threshold: t('Threshold transaction', 'Порогова операція'),
  structuring: t('Possible structuring', 'Можливе дроблення'),
  velocity: t('Velocity', 'Частота операцій'),
  sanctions: t('Sanctions screening', 'Санкційна перевірка'),
  geography: t('Geography', 'Географія'),
  mismatch: t('Funds do not match', 'Кошти не збігаються'),
  rule: t('Unit rule', 'Правило одиниці'),
};

export const alertStatusLabels: Record<AlertStatus, LocalisedText> = {
  new: t('New', 'Нове'),
  investigating: t('Investigating', 'Розслідується'),
  escalated: t('Escalated', 'Ескальовано'),
  reported: t('Reported', 'Повідомлено регулятору'),
  closed: t('Closed', 'Закрито'),
};

export const kybCheckLabels: Record<KybCheck, LocalisedText> = {
  registry: t('Company registry', 'Державний реєстр'),
  sanctions: t('Sanctions lists', 'Санкційні списки'),
  pep: t('Politically exposed persons', 'Політично значущі особи'),
  adverse_media: t('Adverse media', 'Негативні згадки в медіа'),
  ubo: t('Beneficial owners', 'Кінцеві бенефіціари'),
  website: t('Website and goods', 'Вебсайт і товари'),
  mcc: t('Kind of business (MCC)', 'Вид діяльності (MCC)'),
  bank_account: t('Settlement account', 'Розрахунковий рахунок'),
};

export const conditionFieldLabels: Record<Condition['field'], LocalisedText> = {
  amount: t('Amount', 'Сума'),
  currency: t('Currency', 'Валюта'),
  instrument: t('Instrument', 'Інструмент'),
  payer_country: t('Payer’s country', 'Країна платника'),
  issuer_country: t('Issuer’s country', 'Країна емітента'),
  mcc_risk: t('Business risk', 'Ризик діяльності'),
  score: t('Risk score', 'Бал ризику'),
  attempts_24h: t('Attempts in 24 h', 'Спроб за 24 год'),
  amount_24h: t('Amount in 24 h', 'Сума за 24 год'),
};
