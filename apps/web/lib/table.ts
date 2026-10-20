import type { Column } from '@/components/panels/DataTable';

export type Query = Record<string, string | undefined>;

/** The query of a list page as plain strings (the first value of each parameter). */
export async function readQuery(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<Query> {
  const raw = await searchParams;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

/** Rows sorted by the column the query names (or as given), then cut to the page the query asks for. */
export function sortAndPage<R>(rows: R[], columns: Column<R>[], query: Query, pageSize = 25): { rows: R[]; total: number; page: number } {
  const column = columns.find((c) => c.key === query.sort && c.sort);
  const sorted = column ? [...rows].sort((a, b) => { const x = column.sort!(a); const y = column.sort!(b); const d = x < y ? -1 : x > y ? 1 : 0; return query.dir === 'asc' ? d : -d; }) : rows;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  return { rows: sorted.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page };
}

/** Whether a row's text matches a search, case-insensitively. */
export function matches(q: string | undefined, ...texts: Array<string | null | undefined>): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return texts.some((x) => x?.toLowerCase().includes(needle));
}
