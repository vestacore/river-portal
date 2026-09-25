/** Firestore paths owned by the feed package. */
export const feedPaths = {
  item: (orgId: string, itemId: string) => `orgs/${orgId}/feed/${itemId}`,
  items: (orgId: string) => `orgs/${orgId}/feed`,
  publicItem: (orgId: string, itemId: string) => `public/${orgId}/feed/${itemId}`,
  publicItems: (orgId: string) => `public/${orgId}/feed`,
};
