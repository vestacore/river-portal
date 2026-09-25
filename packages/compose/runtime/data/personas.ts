import type { Persona } from '../types/Persona.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/** One persona per role on the river. Names come from the active profile's demo variant. */
export const personas: readonly Persona[] = [
  { id: 'olena', personId: 'person_demo_olena', roles: ['recipient'], bank: 'left', home: '/me',
    description: t('Asked for a generator for her family; confirms delivery and says thank you.', 'Попросила генератор для родини; підтверджує отримання й дякує.') },
  { id: 'james', personId: 'person_demo_james', roles: ['giver'], bank: 'right', home: '/me',
    description: t('Gives monthly; wants to see where each gift went.', 'Дарує щомісяця; хоче бачити, куди пішов кожен дар.') },
  { id: 'harbour', personId: 'person_demo_harbour', roles: ['sponsor', 'giver'], bank: 'right', home: '/me',
    description: t('A company that sponsors transport and needs reports for its board.', 'Компанія, що спонсорує перевезення і потребує звітів для правління.') },
  { id: 'mykola', personId: 'person_demo_mykola', roles: ['carrier'], bank: 'channel', home: '/me',
    description: t('Volunteer driver: hands over deliveries and records costs on the way.', 'Водій-волонтер: передає допомогу й записує витрати в дорозі.') },
  { id: 'andriy', personId: 'person_demo_andriy', roles: ['coordinator'], bank: 'channel', home: '/studio',
    description: t('Coordinator: reviews requests, matches gifts, plans deliveries.', 'Координатор: розглядає звернення, поєднує дари, планує доставки.') },
  { id: 'helen', personId: 'person_demo_helen', roles: ['finance_steward'], bank: 'stewards', home: '/studio/tolls',
    description: t('Finance Steward: approves costs above the coordinator\'s limit.', 'Фінансова відповідальна: погоджує витрати понад ліміт координатора.') },
  { id: 'sofia', personId: 'person_demo_sofia', roles: ['editor'], bank: 'stewards', home: '/studio/surface',
    description: t('Editor: site texts, reports and the feed.', 'Редакторка: тексти сайту, звіти й стрічка.') },
  { id: 'iryna', personId: 'person_demo_iryna', roles: ['administrator'], bank: 'stewards', home: '/studio/settings',
    description: t('Administrator: settings, profile and everything else.', 'Адміністраторка: налаштування, профіль і все інше.') },
  { id: 'priya', personId: 'person_demo_priya', roles: ['auditor'], bank: 'stewards', home: '/studio',
    description: t('Auditor: can see everything in the studio, change nothing.', 'Аудитор: бачить усе в студії, нічого не змінює.') },
];
