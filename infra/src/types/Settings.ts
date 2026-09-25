/** Stack settings read from Pulumi config. */
export type Settings = {
  project: string;
  region: string;
  firestoreLocation: string;
  orgId: string;
  /** Settings profile the organisation starts from (adr/records/ADR-0020); later changes are made in the studio. */
  profile: 'state-programme' | 'city-foundation' | 'small-nationwide';
  seed: 'demo' | 'none';
  aiModel: string;
  aiLocation: string;
  domain: string | undefined;
  iapMembers: string[];
  staffRoles: string;
  repoRoot: string;
};
