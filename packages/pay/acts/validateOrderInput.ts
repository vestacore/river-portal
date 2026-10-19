import type { FieldError, Result } from '@river/kernel';
import { currencies, type Currency } from '@river/pay-facts';
import { orderLimits } from './data/orderLimits.ts';
import { parseAmount } from './parseAmount.ts';
import type { OrderInput } from './types/OrderInput.ts';

/**
 * Checks a merchant's order form. The payer is named by a handle — letters, digits, `.`, `_`, `-` —
 * never by a name or an e-mail address: the handle enters the stream, and personal data must not.
 */
export function validateOrderInput(raw: Record<string, unknown>): Result<OrderInput> {
  const errors: FieldError[] = [];
  const title = String(raw.title ?? '').trim();
  if (title.length === 0) errors.push({ field: 'title', code: 'required' });
  else if (title.length > orderLimits.titleMax) errors.push({ field: 'title', code: 'tooLong' });

  const amountMinor = parseAmount(String(raw.amount ?? ''));
  if (amountMinor === null) errors.push({ field: 'amount', code: 'invalid' });
  else if (amountMinor < orderLimits.minMinor) errors.push({ field: 'amount', code: 'tooSmall' });
  else if (amountMinor > orderLimits.maxMinor) errors.push({ field: 'amount', code: 'tooLarge' });

  const currency = String(raw.currency ?? '');
  if (!(currencies as readonly string[]).includes(currency)) errors.push({ field: 'currency', code: 'invalid' });

  const payerRef = String(raw.payerRef ?? '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(payerRef)) errors.push({ field: 'payerRef', code: 'invalid' });

  if (errors.length > 0 || amountMinor === null) return { ok: false, errors };
  return { ok: true, value: { title, amountMinor, currency: currency as Currency, payerRef } };
}
