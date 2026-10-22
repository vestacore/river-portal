import type { Locale } from '@river/i18n';
import { lt } from '../lt';

/** The note kept with a policy setting, as typed — except the runtime's own record of an accepted proposal, which reads in both languages. */
export function settingNote(note: string | undefined, locale: Locale): string | null {
  if (!note) return null;
  const accepted = /^Accepted from (ins_\w+)$/.exec(note);
  return accepted ? lt(locale)(`Accepted from the agents’ proposal ${accepted[1]}`, `Прийнято з пропозиції агентів ${accepted[1]}`) : note;
}
