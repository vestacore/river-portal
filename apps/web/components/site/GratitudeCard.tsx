import { formatDate, oblastName, type Locale } from '@river/i18n';
import type { GratitudeCard as Gratitude } from '@river/pages';

/** A consented, redacted thank-you as a margin note in the language it was written in. */
export function GratitudeCard({ card, locale }: { card: Gratitude; locale: Locale }) {
  return (
    <figure className="relative border-l-2 border-sunrise-500 pl-6">
      <blockquote lang={card.locale === 'uk' ? 'uk' : 'en-GB'} className="text-xl font-light italic leading-relaxed text-ink-900 sm:text-2xl">{card.locale === 'uk' ? `«${card.text}»` : `“${card.text}”`}</blockquote>
      <figcaption className="annot mt-4 text-ink-500">— {oblastName(card.oblastId, locale)} · {formatDate(card.at, locale)}</figcaption>
    </figure>
  );
}
