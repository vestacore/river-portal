/** Canonical need statuses (spec: Canonical Parameters / Need). There is no "rejected" state. */
export const needStatuses = [
  'submitted', 'acknowledged', 'triaged', 'open', 'partially_matched', 'matched', 'in_delivery',
  'delivered', 'confirmed', 'closed', 'on_hold', 'withdrawn', 'referred',
] as const;
export type NeedStatus = (typeof needStatuses)[number];
