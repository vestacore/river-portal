/** Where an order or a session comes from. */
export const channels = ['web', 'app', 'pos', 'link', 'invoice', 'api', 'subscription'] as const;
export type Channel = (typeof channels)[number];
