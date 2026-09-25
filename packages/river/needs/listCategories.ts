import { categories } from './data/categories.ts';
import type { Category } from './types/Category.ts';

/** All categories in display order. */
export function listCategories(): readonly Category[] {
  return categories;
}
