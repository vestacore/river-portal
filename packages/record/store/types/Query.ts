/** Minimal query model supported by every driver. Dotted field paths address nested fields. */
export type QueryFilter = { field: string; op: '==' | 'in' | 'array-contains'; value: unknown };

export type Query = {
  where?: QueryFilter[];
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
};
