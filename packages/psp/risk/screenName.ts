import { screeningList } from './data/screeningList.ts';

const normal = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-zа-яіїєґ0-9 ]/g, '').replace(/\b(llc|ltd|tov|тов|fze|gmbh)\b/g, '').replace(/\s+/g, ' ').trim();

/** Names on the screening list that a name resembles: the same words, or one name inside the other. */
export function screenName(name: string, list: readonly string[] = screeningList): string[] {
  const n = normal(name);
  if (!n) return [];
  return list.filter((entry) => { const e = normal(entry); return e === n || e.includes(n) || n.includes(e); });
}
