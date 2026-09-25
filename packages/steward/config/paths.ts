/** Firestore paths owned by the config package. */
export const configPaths = {
  settings: (orgId: string) => `orgs/${orgId}/config/settings`,
};
