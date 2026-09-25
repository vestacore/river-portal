/**
 * The three setting profiles (meta: Iteration 04): a state-level programme, a city foundation of
 * medium size, and a small organisation working across a whole country.
 */
export const profileIds = ['state-programme', 'city-foundation', 'small-nationwide'] as const;
export type ProfileId = (typeof profileIds)[number];
