/** Firestore paths owned by the gifts package. */
export const giftPaths = {
  gift: (orgId: string, giftId: string) => `orgs/${orgId}/gifts/${giftId}`,
  gifts: (orgId: string) => `orgs/${orgId}/gifts`,
  giverPrivate: (orgId: string, giftId: string) => `orgs/${orgId}/giverPrivate/${giftId}`,
  campaign: (orgId: string, campaignId: string) => `orgs/${orgId}/campaigns/${campaignId}`,
  campaigns: (orgId: string) => `orgs/${orgId}/campaigns`,
};
