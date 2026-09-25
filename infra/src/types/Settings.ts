/** Stack settings read from Pulumi config. */
export type Settings = {
  project: string;
  region: string;
  firestoreLocation: string;
  orgId: string;
  seed: 'demo' | 'none';
  aiModel: string;
  aiLocation: string;
  domain: string | undefined;
  iapMembers: string[];
  staffRoles: string;
  repoRoot: string;
};
