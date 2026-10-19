import { redirect } from 'next/navigation';
import type { Locale } from '@river/i18n';
import { href } from '../href';
import { getPayOperator } from './getPayOperator';
import type { PayOperator } from './types';

/**
 * Every operator page calls this before it reads anything. A check in the layout alone is not
 * enough: a layout's redirect does not stop the page beneath it from rendering, and what the page
 * read would travel in the body of the redirect.
 */
export async function requireOperator(locale: Locale): Promise<PayOperator> {
  const operator = await getPayOperator(locale);
  if (!operator) redirect(href(locale, '/pay'));
  return operator;
}
