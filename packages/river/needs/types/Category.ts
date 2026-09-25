import type { LocalisedText } from '@river/i18n';

/** A kind of help (spec: 02-entities/system/Category). `icon` is a UI icon key. */
export type Category = { id: string; icon: string; label: LocalisedText };
