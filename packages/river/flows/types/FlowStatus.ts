/** Canonical flow statuses (spec: Flow). */
export const flowStatuses = ['forming', 'committed', 'in_motion', 'arrived', 'confirmed', 'reported', 'closed'] as const;
export type FlowStatus = (typeof flowStatuses)[number];
