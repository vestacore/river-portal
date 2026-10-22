import type { Locale } from '@river/i18n';
import { lt } from '@/lib/lt';
import type { Query } from '@/lib/table';

const words: Record<string, [string, string]> = {
  accepted: ['Accepted: the proposal was carried out and recorded.', 'Прийнято: пропозицію виконано й записано.'],
  declined: ['Declined and recorded.', 'Відхилено й записано.'],
  captured: ['Captured: the money was taken and split.', 'Списано: гроші взято й розщеплено.'],
  released: ['The hold was released.', 'Блокування знято.'],
  refunded: ['Refunded from the shares that received it.', 'Повернено з часток, що їх отримали.'],
  evidenced: ['Evidence submitted to the scheme.', 'Докази подано платіжній системі.'],
  cleared: ['Cleared: the attempt goes on down the river.', 'Дозволено: спроба рухається далі.'],
  rejected: ['Rejected: the attempt stops here.', 'Відхилено: спроба зупиняється тут.'],
  taken: ['Taken: what arrived is received and captured; anything short stays due on the invoice.', 'Прийнято: те, що надійшло, зараховано й списано; нестача лишається до сплати за інвойсом.'],
  returned: ['Returned to the payer; the attempt ends here.', 'Повернуто платнику; спроба завершується тут.'],
  updated: ['Updated.', 'Оновлено.'], decided: ['Decided.', 'Вирішено.'], picked: ['Picking recorded: the picked amount is captured and the rest of the hold released.', 'Комплектацію записано: суму комплектації списано, залишок блокування розблоковано.'], voided: ['Voided.', 'Анульовано.'], reminded: ['A reminder went out.', 'Нагадування надіслано.'],
  moved: ['Moved along.', 'Переміщено.'], saved: ['Saved.', 'Збережено.'], cleared_policy: ['Cleared.', 'Скинуто.'], created: ['Created.', 'Створено.'],
  granted: ['Granted.', 'Надано.'], revoked: ['Revoked.', 'Відкликано.'], approved: ['Approved and granted.', 'Схвалено й надано.'], sent: ['Sent.', 'Надіслано.'],
};

/** Why a command refused, in words: the runtime's reason stays beside it, as it came. */
const refusals: Array<[RegExp, string, string]> = [
  [/^nothing_to_decide$/, 'There is nothing left to decide here.', 'Тут уже нічого вирішувати.'],
  [/^resolution_required$/, 'Choose a decision for the difference.', 'Оберіть рішення щодо розбіжності.'],
  [/^invalid_amount$/, 'The amount does not look right: enter it in hryvnias, zero or more.', 'Сума виглядає некоректно: вкажіть її в гривнях, нуль або більше.'],
  [/^not_found$/, 'It is not there any more.', 'Цього вже немає.'],
  [/^no [a-z.]+ at \S+ in this profile$/, 'This profile has no right to do that here.', 'Цей профіль не має права робити це тут.'],
  [/^this profile is not active$/, 'This profile is no longer active.', 'Цей профіль більше не діє.'],
  [/^separation of duties/, 'It would break a separation of duties.', 'Це порушило б розподіл обов’язків.'],
  [/^not the profile you act in$/, 'Not the profile you are acting in.', 'Не профіль, у якому ви зараз дієте.'],
  [/^nobody grants themselves$/, 'Nobody grants a role to themselves.', 'Ніхто не надає роль сам собі.'],
  [/^only an administrator grants administration$/, 'Only an administrator grants the administrator’s role.', 'Роль адміністратора надає лише адміністратор.'],
  [/^not yours to decide$/, 'A request is decided by someone other than the person who asked.', 'Запит вирішує не та людина, що його подала.'],
  [/^already decided$/, 'It has already been decided.', 'Це вже вирішено.'],
  [/^already picked$/, 'The order has already been picked.', 'Замовлення вже скомплектовано.'],
  [/is not a step$/, 'A contract cannot take that step from where it stands today.', 'Договір не може зробити цей крок зі свого сьогоднішнього стану.'],
  [/^the merchant has no active contract$/, 'The merchant has no active contract, so it cannot take payments.', 'Мерчант не має чинного договору, тож не може приймати платежі.'],
  [/^the merchant cannot take payments yet$/, 'The merchant cannot take payments yet.', 'Мерчант ще не може приймати платежі.'],
];

/** What the last action did, or why it did nothing — read from the page's `done` or `error` parameter. */
export function Flash({ query, locale }: { query: Query; locale: Locale }) {
  const t = lt(locale);
  if (query.error) {
    const why = refusals.find(([pattern]) => pattern.test(query.error!));
    return <p role="alert" className="mb-4 border-l-2 border-attention-500 bg-attention-100 px-3 py-2 text-[0.88rem] text-ink-900">{t('Not done:', 'Не виконано:')} {why ? `${t(why[1], why[2])} ` : null}<span className="font-mono text-[0.75rem] text-ink-700">{query.error}</span></p>;
  }
  if (query.done) { const w = words[query.done] ?? [query.done, query.done]; return <p role="status" className="mb-4 border-l-2 border-teal-600 bg-teal-100 px-3 py-2 text-[0.88rem] text-ink-900">{t(w[0], w[1])}</p>; }
  return null;
}
