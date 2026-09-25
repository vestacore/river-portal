// @river/privacy — visibility levels, redaction, public pseudonymisation.
export { visibilityLevels } from './types/Visibility.ts';
export type { Visibility } from './types/Visibility.ts';
export { recipientKinds } from './types/RecipientKind.ts';
export type { RecipientKind } from './types/RecipientKind.ts';
export { isVisibleAt } from './isVisibleAt.ts';
export { redactPii } from './redactPii.ts';
export { describeRecipientPublicly } from './describeRecipientPublicly.ts';
