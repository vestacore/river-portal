import { categories } from './data/categories.ts';
import type { Category } from './types/Category.ts';

/** The category with `id`, or undefined. */
export function findCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
