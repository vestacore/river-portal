/** Firestore paths owned by the flows package. */
export const flowPaths = {
  flow: (orgId: string, flowId: string) => `orgs/${orgId}/flows/${flowId}`,
  flows: (orgId: string) => `orgs/${orgId}/flows`,
  gratitude: (orgId: string, noteId: string) => `orgs/${orgId}/gratitude/${noteId}`,
};
