/** Firestore paths of page documents. */
export const pagePaths = {
  site: (orgId: string) => `public/${orgId}`,
  campaign: (orgId: string, slug: string) => `public/${orgId}/campaigns/${slug}`,
};
