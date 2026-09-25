/** Firestore paths owned by the needs package. */
export const needPaths = {
  record: (orgId: string, needId: string) => `orgs/${orgId}/needs/${needId}`,
  collection: (orgId: string) => `orgs/${orgId}/needs`,
  private: (orgId: string, needId: string) => `orgs/${orgId}/needPrivate/${needId}`,
  tracking: (orgId: string, tokenHash: string) => `orgs/${orgId}/tracking/${tokenHash}`,
};
