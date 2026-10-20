import type { SplitTemplate } from '../types/SplitTemplate.ts';

export const splitTemplates: readonly SplitTemplate[] = [
  { id: 'direct', label: { 'en-GB': 'Direct', uk: 'Напряму' },
    description: { 'en-GB': 'The merchant receives the amount less the PSP’s fee.', uk: 'Мерчант отримує суму за вирахуванням комісії PSP.' } },
  { id: 'marketplace', label: { 'en-GB': 'Marketplace', uk: 'Маркетплейс' },
    description: { 'en-GB': 'Each seller receives its lines less the commission; the marketplace keeps the rest after the fee and any share for a good cause.', uk: 'Кожен продавець отримує свої позиції мінус комісія; маркетплейс залишає решту після комісії PSP та частки на добру справу.' } },
  { id: 'agency', label: { 'en-GB': 'Agency', uk: 'Агентська схема' },
    description: { 'en-GB': 'Suppliers (a hotel, a carrier) receive their lines; the agency keeps its margin.', uk: 'Постачальники (готель, перевізник) отримують свої позиції; агенція залишає маржу.' } },
  { id: 'franchise', label: { 'en-GB': 'Franchise', uk: 'Франшиза' },
    description: { 'en-GB': 'The franchisor receives a royalty from every payment; the point of sale keeps the rest.', uk: 'Франчайзер отримує роялті з кожного платежу; точка продажу залишає решту.' } },
];
