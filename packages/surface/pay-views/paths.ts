/** Where the surface of the payment river keeps its views under `root` (for example `orgs/demo`). */
export const payViewPaths = {
  orders: (root: string) => `${root}/payOrders`,
  order: (root: string, orderId: string) => `${root}/payOrders/${orderId}`,
};
