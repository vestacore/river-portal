import type { Locale } from '@river/i18n';
import type { Cell } from '@/components/panels/Value';
import { lt } from '@/lib/lt';
import type { SystemState } from './systemHealth';

/** A system's state as a status: what it means in a word, in the tone every panel uses for it. */
export function stateCell(state: SystemState, locale: Locale): Extract<Cell, { kind: 'status' }> {
  const t = lt(locale);
  switch (state) {
    case 'working': return { kind: 'status', label: t('working', 'працює'), tone: 'success' };
    case 'degraded': return { kind: 'status', label: t('some failures', 'є збої'), tone: 'warning' };
    case 'failing': return { kind: 'status', label: t('failing', 'збоїть'), tone: 'danger' };
    case 'quiet': return { kind: 'status', label: t('quiet for a day', 'тиша впродовж доби'), tone: 'neutral' };
    case 'unseen': return { kind: 'status', label: t('outside your reach', 'поза вашими межами'), tone: 'neutral' };
  }
}
