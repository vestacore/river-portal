import type { AccessRequest } from './types/Access.ts';

/** Whether a person may decide an access request: it is pending and it is not their own. */
export function canDecideRequest(request: AccessRequest, deciderId: string): boolean {
  return request.status === 'pending' && request.personId !== deciderId;
}
