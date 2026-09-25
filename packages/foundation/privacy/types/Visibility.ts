/**
 * Canonical visibility levels (spec: 09-privacy-ethics/Visibility Levels), from most closed to most open.
 * Anything touching a person defaults to `private`.
 */
export const visibilityLevels = ['sealed', 'private', 'team', 'participants', 'public'] as const;
export type Visibility = (typeof visibilityLevels)[number];
