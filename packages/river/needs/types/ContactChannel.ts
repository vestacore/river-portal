export const contactChannels = ['phone', 'email', 'messenger'] as const;
export type ContactChannel = (typeof contactChannels)[number];
