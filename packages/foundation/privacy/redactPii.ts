const emailPattern = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const phonePattern = /\+?\d[\d\s().-]{6,}\d/g;
const handlePattern = /(^|\s)@[\w.]{3,}/g;
const streetPattern = /(?<![\p{L}])(вул\.|вулиця|просп\.|провулок|пров\.|street|st\.|avenue|road|rd\.)\s*[\p{L}\p{N}'’ .-]{2,40}?\s*\d+[\p{L}]?/giu;

/**
 * Removes contact details, street addresses and the given names from free text before it leaves
 * `private` (for example before an AI prompt or a public draft). Conservative: it prefers to
 * over-redact (name stems also match inflected forms). The placeholder is language-neutral.
 */
export function redactPii(text: string, names: readonly string[] = []): string {
  let out = text
    .replace(emailPattern, '[…]')
    .replace(phonePattern, '[…]')
    .replace(handlePattern, '$1[…]')
    .replace(streetPattern, '[…]');
  for (const name of names) {
    for (const word of name.trim().split(/\s+/)) {
      if (word.length < 2) continue;
      // Ukrainian names and places inflect (Балаклія → Балаклії, Олена → Олені): match a stem of at
      // least four letters plus an ending of up to four, so "Peter" does not swallow "petrol".
      const stem = word.length >= 6 ? word.slice(0, -2) : word.length === 5 ? word.slice(0, -1) : word;
      const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(?<![\\p{L}])${escaped}[\\p{L}'’]{0,4}(?![\\p{L}])`, 'giu'), '[…]');
    }
  }
  return out;
}
