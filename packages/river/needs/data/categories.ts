import type { Category } from '../types/Category.ts';

export const categories: readonly Category[] = [
  { id: 'food', icon: 'basket', label: { 'en-GB': 'Food', uk: 'Продукти' } },
  { id: 'medicine', icon: 'pill', label: { 'en-GB': 'Medicine and care', uk: 'Ліки та догляд' } },
  { id: 'energy', icon: 'bolt', label: { 'en-GB': 'Power and heating', uk: 'Світло й тепло' } },
  { id: 'shelter', icon: 'home', label: { 'en-GB': 'Shelter and repairs', uk: 'Житло та ремонт' } },
  { id: 'hygiene', icon: 'drop', label: { 'en-GB': 'Hygiene', uk: 'Гігієна' } },
  { id: 'clothing', icon: 'shirt', label: { 'en-GB': 'Clothing and bedding', uk: 'Одяг і постіль' } },
  { id: 'children', icon: 'heart', label: { 'en-GB': 'For children', uk: 'Для дітей' } },
  { id: 'mobility', icon: 'wheel', label: { 'en-GB': 'Mobility aids', uk: 'Засоби пересування' } },
  { id: 'education', icon: 'book', label: { 'en-GB': 'Learning', uk: 'Навчання' } },
  { id: 'transport', icon: 'van', label: { 'en-GB': 'A ride or transport', uk: 'Перевезення' } },
  { id: 'other', icon: 'dots', label: { 'en-GB': 'Something else', uk: 'Інше' } },
];
