import type { CarrierKind } from './CarrierKind.ts';
import type { CostLine } from './CostLine.ts';
import type { FlowStatus } from './FlowStatus.ts';

/** Team view of a flow (`orgs/{org}/flows/{id}`): the stream linking gifts to needs. */
export type Flow = {
  id: string;
  status: FlowStatus;
  needIds: string[];
  giftIds: string[];
  campaignId: string | null;
  oblastId: string;
  lead: string;
  carrier: { kind: CarrierKind; name: string; personId: string | null } | null;
  fromLabel: string | null;
  costs: CostLine[];
  confirmations: Array<{ needId: string; by: string; at: string }>;
  gratitude: Array<{ noteId: string; needId: string; locale: string; onWall: boolean; sharedWithParticipants: boolean }>;
  reportId: string | null;
  formedAt: string;
  dispatchedAt: string | null;
  arrivedAt: string | null;
  confirmedAt: string | null;
  updatedAt: string;
};
