import type { BlockDefinition } from '../types/BlockDefinition.ts';

/** Every editable region of the public site, with default texts in both locales. */
export const siteBlocks: readonly BlockDefinition[] = [
  {
    id: 'home.hero.title', mode: 'inline', label: 'Home — headline',
    defaults: { 'en-GB': '{{org.tagline}}', uk: '{{org.tagline}}' },
  },
  {
    id: 'home.hero.lead', mode: 'rich', label: 'Home — introduction',
    defaults: {
      'en-GB': '{{org.scope}}',
      uk: '{{org.scope}}',
    },
  },
  {
    id: 'home.how.title', mode: 'inline', label: 'Home — how it works, title',
    defaults: { 'en-GB': 'How the river works', uk: 'Як тече ріка' },
  },
  {
    id: 'home.how.lead', mode: 'rich', label: 'Home — how it works, introduction',
    defaults: {
      'en-GB': 'Two banks, one river. A need on one side, a gift on the other, and people in between who make sure it arrives.',
      uk: 'Два береги — одна ріка. Потреба з одного боку, дар — з іншого, а посередині люди, які дбають, щоб допомога дійшла.',
    },
  },
  {
    id: 'home.feed.title', mode: 'inline', label: 'Home — feed title',
    defaults: { 'en-GB': 'From the river', uk: 'Новини з ріки' },
  },
  {
    id: 'home.thanks.title', mode: 'inline', label: 'Home — thanks title',
    defaults: { 'en-GB': 'Thanks that travelled back', uk: 'Подяки, що повернулися' },
  },
  {
    id: 'ask.title', mode: 'inline', label: 'Ask — title',
    defaults: { 'en-GB': 'Ask for help', uk: 'Попросити про допомогу' },
  },
  {
    id: 'ask.lead', mode: 'rich', label: 'Ask — reassurance',
    defaults: {
      'en-GB': "Tell us what you need in your own words. You don't need to prove anything, and you don't need an account. We read every request, and a coordinator will reply within {{help.replyWithinDays}} days. If we cannot help, we will tell you who can.",
      uk: 'Розкажіть своїми словами, що вам потрібно. Нічого не треба доводити, і реєстрація не потрібна. Ми читаємо кожне звернення, а координатор відповість протягом {{help.replyWithinDays}} днів. Якщо ми не зможемо допомогти, підкажемо, хто зможе.',
    },
  },
  {
    id: 'give.title', mode: 'inline', label: 'Give — title',
    defaults: { 'en-GB': 'Share what you can', uk: 'Поділіться тим, чим можете' },
  },
  {
    id: 'give.lead', mode: 'rich', label: 'Give — introduction',
    defaults: {
      'en-GB': 'Money, goods, a lift or an afternoon of your time. Every gift is shaped by a real need, and you will see where it went.',
      uk: 'Гроші, речі, поїздка чи кілька годин вашого часу. Кожен дар відповідає справжній потребі, і ви побачите, куди він потрапив.',
    },
  },
  {
    id: 'footer.note', mode: 'rich', label: 'Footer — organisation note',
    defaults: {
      'en-GB': '{{org.scope}} Every figure on this site comes from our own records. This is a demonstration of River Portal; the organisation is fictional.',
      uk: '{{org.scope}} Кожна цифра на сайті походить з наших власних записів. Це демонстрація River Portal; організація вигадана.',
    },
  },
];
