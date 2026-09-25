/** For whom a need is expressed. Drives public phrasing, never priority. */
export const recipientKinds = ['self', 'family', 'neighbours', 'institution'] as const;
export type RecipientKind = (typeof recipientKinds)[number];
