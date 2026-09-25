import type { BlockDefinition } from '../types/BlockDefinition.ts';

/**
 * Page texts (about, policies, questions and answers) with defaults in both locales. Defaults use
 * the small Markdown subset of plainToRichDoc (blank line between blocks, "## " headings, "- " lists)
 * and {{key}} tokens filled from the organisation's settings, so one text serves every profile.
 */
export const pageBlocks: readonly BlockDefinition[] = [
  {
    id: 'home.about.teaser', mode: 'rich', label: 'Home — who we are',
    defaults: {
      'en-GB': `{{org.name}} connects people who need help with people who want to give. We have been doing this since {{org.foundedYear}}, and we do it in the open: every gift can be traced, and every cost is shown.

Four simple ideas guide our work. Anyone may ask. A gift is a gift. Your details stay private. Our numbers are honest.`,
      uk: `«{{org.name}}» поєднує людей, яким потрібна допомога, з тими, хто хоче нею поділитися. Ми робимо це з {{org.foundedYear}} року — і робимо відкрито: кожен дар можна простежити, а кожну витрату видно.

Нашу роботу ведуть чотири прості правила. Просити може кожен. Дар — це дар. Ваші дані залишаються приватними. Наші цифри чесні.`,
    },
  },
  {
    id: 'about.body', mode: 'rich', label: 'About — main text',
    defaults: {
      'en-GB': `## Who we are

{{org.name}} connects people who need help with people who want to give. {{org.scope}}

We have been working since {{org.foundedYear}}, together with givers, drivers, volunteers and partner organisations who share our way of working.

## How we work

We think of our work as a river with two banks. On one bank are people who need something specific. On the other are people who want to share. Between them, people make sure that help arrives.

- Anyone can ask for help, in their own words.
- Givers offer money, goods, transport, a service or their time.
- Coordinators match each need with a gift, in the form it is needed.
- Drivers and volunteers carry the help to where it is needed.
- The person who receives it confirms that it has arrived.
- If they wish, their thanks travels back to everyone who helped.

## What we believe

- A gift is a gift. Nobody buys anything with a donation, and we never rank givers.
- Anyone may ask. Nobody has to prove that they deserve help.
- Private by default. Only the people who arrange your help see your details.
- Honest numbers. Every figure comes from our own records, and we show what delivery costs.

## How we are accountable

We record every step: each request, gift, cost, delivery and correction. Records are never quietly changed. A mistake is fixed with a new entry, so the history stays visible. The numbers on this website come from these records, and our reports show what was raised, what was spent and what arrived. Independent auditors can read our records, but they cannot change them.

Legal name: {{org.legalName}}. Registration: {{org.registration}}.

If you think we have got something wrong, please tell us at {{contact.email}}. We will listen, and we will reply.`,
      uk: `## Хто ми

«{{org.name}}» поєднує людей, яким потрібна допомога, з тими, хто хоче нею поділитися. {{org.scope}}

Ми працюємо з {{org.foundedYear}} року — разом із дарувальниками, водіями, волонтерами й партнерськими організаціями, яким близький наш підхід.

## Як ми працюємо

Ми уявляємо свою роботу як ріку з двома берегами. На одному березі — люди, яким потрібне щось конкретне. На іншому — ті, хто хоче поділитися. А між берегами люди дбають про те, щоб допомога дійшла.

- Попросити про допомогу може кожен — своїми словами.
- Дарувальники пропонують гроші, речі, перевезення, послугу чи свій час.
- Координатори поєднують кожну потребу з даром — у тій формі, яка потрібна.
- Водії та волонтери везуть допомогу туди, де її чекають.
- Людина, яка її отримала, підтверджує, що допомога дійшла.
- Якщо людина хоче, її подяка повертається до всіх, хто допоміг.

## У що ми віримо

- Дар — це дар. За пожертву нічого не купують, і ми ніколи не складаємо рейтингів дарувальників.
- Просити може кожен. Ніхто не мусить доводити, що заслуговує на допомогу.
- Приватність за замовчуванням. Ваші дані бачать лише ті, хто організовує вашу допомогу.
- Чесні цифри. Кожна цифра походить із наших записів, і ми показуємо, скільки коштує доставка.

## Як ми відповідаємо за свою роботу

Ми записуємо кожен крок: кожне звернення, дар, витрату, доставку й виправлення. Записи ніхто не змінює потай. Помилку виправляють новим записом, тож історію завжди видно. Цифри на цьому сайті походять із цих записів, а наші звіти показують, скільки зібрано, скільки витрачено і що дійшло. Незалежні аудитори можуть переглядати наші записи, але не можуть їх змінювати.

Юридична назва: {{org.legalName}}. Реєстрація: {{org.registration}}.

Якщо вам здається, що ми десь помилилися, напишіть нам: {{contact.email}}. Ми вислухаємо й відповімо.`,
    },
  },
  {
    id: 'policy.privacy', mode: 'rich', label: 'Privacy notice',
    defaults: {
      'en-GB': `## Who we are

This notice explains what personal data this website collects, why, who can see it and how long we keep it. The controller of your data is {{org.legalName}}, {{contact.address}}. If you have any question about your data, write to {{contact.email}}.

## When you ask for help

We ask only for what we need to help you:

- your first name
- one way to reach you: a phone number, an e-mail address or a messenger username
- your oblast and your town or village
- what you need, in your own words, and what kind of help it is
- who the help is for, how many people are in the household, how urgent it is and which language you prefer

You must agree that we may contact you, or we cannot reply. You may also agree that we tell your story without your name. That is your choice, and saying no changes nothing about your help.

Please tell us only what we need. After you send a request, you get a private link to follow it. Keep it safe: anyone who has the link can see how your request is going.

## When you give

We ask for:

- your name and e-mail address
- what you give: an amount, goods, transport, a service or time
- whether we may show your first name on our pages

If you do not agree to show your first name, you stay anonymous on our public pages. We never ask for card details on this website.

## When you say thank you

If you received help, you may write a thank-you. We keep it privately. We share it only if you agree, and each way of sharing is a separate choice: with the people who helped, and on our public thank-you wall. Thanks that we share never include names, or any place smaller than an oblast.

## Who can see your data

- Only the coordinators working on your request or your gift see your personal details.
- Our public pages show places only at oblast level. They never show names or contact details.
- We never sell your data, and we never use it for marketing.
- Google Cloud hosts this website and stores its data for us in the European Union. It processes the data only on our instructions.
- We use Vertex AI, Google's AI service, only to draft public news from our reports. We remove personal data from the reports first, and a person checks and approves every item before it is published.

## Why we may use your data

We use your data to arrange help and gifts, to keep honest accounts and to keep people safe. The legal grounds are your consent, our legitimate interest in delivering aid, our legal duties (such as keeping accounts) and, in an emergency, protecting someone's life.

## How long we keep it

- Requests and contact details of people who asked for help: 12 months after their last request is closed.
- Givers' details and gift records: the current financial year and 6 more years, for our accounts.
- Records of consent: 6 years after the consent ends, as proof of what was agreed.
- Published stories and thanks: while consent lasts, and no longer than 24 months unless it is renewed.
- Safeguarding records: 6 years for adults; for children, until they turn 25.
- Texts sent to the AI service: 30 days. They are never used to train it.

When a period ends, we delete the personal details. What remains is a record without names, for example that a family in Kharkiv oblast received a generator, so our numbers stay honest.

## Cookies

We use only the cookies this website needs to work: one remembers your language, and one keeps you signed in if you sign in. We do not use advertising or tracking cookies.

## Your rights

You have the right to:

- see the data we hold about you
- correct it
- ask us to delete it
- object to how we use it
- withdraw any consent at any time

To use any of these rights, write to {{contact.email}}. We will reply within one month. Withdrawing consent never affects the help you receive. Sometimes the law makes us keep a record, for example of a gift for our accounts. If so, we will tell you what we keep, why and for how long.

If you are not happy with our reply, you have the right to complain to {{org.privacyAuthority}}.

This privacy notice is a template. The organisation should review it with a lawyer before relying on it.`,
      uk: `## Хто ми

Це повідомлення пояснює, які персональні дані збирає цей сайт, навіщо, хто їх бачить і як довго ми їх зберігаємо. Володілець ваших персональних даних — {{org.legalName}}, {{contact.address}}. З будь-яким питанням про ваші дані пишіть на {{contact.email}}.

## Коли ви просите про допомогу

Ми просимо вказати лише те, що потрібно, щоб вам допомогти:

- ваше ім’я;
- один спосіб зв’язатися з вами: номер телефону, електронну адресу або ім’я користувача в месенджері;
- вашу область і ваше місто чи село;
- що вам потрібно — вашими словами — і який це вид допомоги;
- для кого допомога, скільки людей у родині, наскільки це терміново і якою мовою вам зручніше.

Нам потрібна ваша згода на те, щоб ми з вами зв’язалися, — без неї ми не зможемо відповісти. За бажанням ви можете також погодитися, щоб ми розповіли вашу історію без вашого імені. Це ваш вибір, і відмова ніяк не вплине на допомогу.

Розповідайте лише те, що потрібно. Надіславши звернення, ви отримаєте особисте посилання, щоб стежити за ним. Бережіть це посилання: кожен, хто його має, бачить, що відбувається з вашим зверненням.

## Коли ви даруєте

Ми просимо вказати:

- ваше ім’я та електронну адресу;
- що ви даруєте: суму, речі, перевезення, послугу чи час;
- чи можна показувати ваше ім’я (без прізвища) на наших сторінках.

Якщо ви на це не погодилися, на публічних сторінках ви залишаєтеся анонімними. На цьому сайті ми ніколи не просимо даних картки.

## Коли ви дякуєте

Якщо ви отримали допомогу, можете написати подяку. Ми зберігаємо її приватно. Показуємо її лише з вашої згоди — окремої для кожного способу: людям, які допомагали, і на нашій публічній стіні подяк. У подяках, які ми показуємо, ніколи немає імен чи місць, точніших за область.

## Хто бачить ваші дані

- Ваші персональні дані бачать лише координатори, які працюють із вашим зверненням чи даром.
- Публічні сторінки показують місця лише з точністю до області. Імен і контактів вони ніколи не показують.
- Ми ніколи не продаємо ваших даних і не використовуємо їх для реклами.
- Google Cloud розміщує цей сайт і зберігає його дані для нас у Європейському Союзі. Як розпорядник даних цей сервіс обробляє їх лише за нашими вказівками.
- Ми використовуємо Vertex AI, сервіс штучного інтелекту від Google, лише щоб готувати чернетки публічних новин на основі наших звітів. Спершу ми вилучаємо зі звітів персональні дані, а кожну новину перед публікацією перевіряє й затверджує людина.

## Чому ми можемо використовувати ваші дані

Ми використовуємо ваші дані, щоб організувати допомогу й дари, вести чесний облік і берегти людей від шкоди. Підстави для цього — ваша згода, наш законний інтерес у наданні допомоги, наші обов’язки за законом (наприклад, вести бухгалтерський облік), а в надзвичайній ситуації — захист чийогось життя.

## Скільки ми зберігаємо дані

- Звернення й контакти людей, які просили про допомогу, — 12 місяців після закриття їхнього останнього звернення.
- Дані дарувальників і записи про дари — поточний фінансовий рік і ще 6 років після нього, для бухгалтерського обліку.
- Записи про згоди — 6 років після того, як згода припинила діяти: це доказ того, на що саме погодилися.
- Опубліковані історії та подяки — доки діє згода, але не довше ніж 24 місяці, якщо її не поновили.
- Записи з питань захисту — 6 років, якщо йдеться про дорослих; якщо про дітей — доки дитині не виповниться 25.
- Тексти, надіслані сервісу штучного інтелекту, — 30 днів. Їх ніколи не використовують, щоб навчати цей сервіс.

Коли строк спливає, ми видаляємо персональні дані. Залишається запис без імен — наприклад, що родина на Харківщині отримала генератор, — тож наші цифри й далі чесні.

## Файли cookie

Ми використовуємо лише ті файли cookie, без яких сайт не працює: один запам’ятовує вашу мову, інший зберігає вхід у систему, якщо ви ввійшли. Рекламних чи відстежувальних файлів cookie ми не використовуємо.

## Ваші права

Ви маєте право:

- бачити дані, які ми про вас зберігаємо;
- виправити їх;
- попросити нас їх видалити;
- заперечити проти того, як ми їх використовуємо;
- будь-коли відкликати будь-яку згоду.

Щоб скористатися будь-яким із цих прав, напишіть на {{contact.email}}. Ми відповімо протягом місяця. Відкликання згоди ніколи не вплине на допомогу, яку ви отримуєте. Іноді закон зобов’язує нас зберігати запис — наприклад, про дар для бухгалтерського обліку. Тоді ми пояснимо, що саме зберігаємо, навіщо і як довго.

Якщо вас не влаштовує наша відповідь, ви маєте право поскаржитися. Куди звертатися: {{org.privacyAuthority}}.

Це повідомлення про конфіденційність — шаблон. Організації варто переглянути його з юристом, перш ніж на нього покладатися.`,
    },
  },
  {
    id: 'policy.safeguarding', mode: 'rich', label: 'Safeguarding',
    defaults: {
      'en-GB': `## Safety comes first

No report, photo or appeal is worth putting anyone at risk. We protect children and adults at risk, including from people who might use help as a way to exploit them. If we are in doubt, we protect first and ask questions afterwards. Help continues while we do.

## Children

- Children (anyone under 18) do not ask for help themselves. A parent, carer or institution asks for them.
- We never publish anything that could identify a child: no names, faces or exact ages, and no school together with a place.
- We never ask children to write or record thanks.
- No driver or volunteer is ever alone with a child. Deliveries are handed to an adult.

## Adults at risk

Some adults cannot fully protect themselves, for example because of age, illness, disability, the loss of their home or someone else's control. We take extra care with them. Help never depends on anything in return: no favours, money, photos or meetings. Givers are not told who received their gift, and people who give and people who receive never swap contact details through us.

## How our drivers and volunteers behave

- We deliver help without conditions and never ask for anything in return.
- We use contact details only for the delivery they were given for.
- We do not photograph people or homes without clear permission.
- We do not share routes, places or times on social media.
- We report any concern straight away.

## If you are worried

Tell our Safeguarding Lead. Write to {{contact.email}} and put the word Safeguarding in the subject line. You do not need proof. You can raise a concern about anyone, including our own staff, volunteers and drivers. We will contact you the same day, and only the people who must act will see what you tell us.

## If someone is in danger now

{{help.emergency}}`,
      uk: `## Безпека понад усе

Жоден звіт, світлина чи заклик не вартий того, щоб наражати когось на небезпеку. Ми захищаємо дітей і дорослих в уразливому становищі — зокрема від тих, хто може використати допомогу, щоб їх експлуатувати. Якщо є сумнів, ми спершу захищаємо, а потім з’ясовуємо. Допомога при цьому не зупиняється.

## Діти

- Діти (усі, кому ще не виповнилося 18) не просять про допомогу самі. За них звертаються батьки, опікуни або заклад.
- Ми ніколи не публікуємо нічого, за чим можна впізнати дитину: ні імен, ні облич, ні точного віку, ні назви школи разом із назвою населеного пункту.
- Ми ніколи не просимо дітей писати чи записувати подяку.
- Жоден водій чи волонтер не залишається наодинці з дитиною. Допомогу передають дорослому.

## Дорослі в уразливому становищі

Деякі дорослі не можуть повністю себе захистити — через вік, хворобу, інвалідність, утрату житла або через те, що їх контролює хтось інший. Ми дбаємо про них особливо уважно. Допомога ніколи не залежить від чогось натомість — ні від послуг, ні від грошей, ні від фото, ні від зустрічей. Дарувальникам не повідомляють, хто саме отримав їхній дар, а ті, хто дарує, і ті, хто отримує, ніколи не обмінюються контактами через нас.

## Як поводяться наші водії та волонтери

- Ми доставляємо допомогу без жодних умов і ніколи нічого не просимо натомість.
- Ми користуємося контактами лише для тієї доставки, для якої їх отримали.
- Ми не фотографуємо людей чи їхні оселі без чіткого дозволу.
- Ми не публікуємо маршрути, місця чи час доставки в соцмережах.
- Ми одразу повідомляємо про будь-яке занепокоєння.

## Якщо вас щось турбує

Зверніться до нашої відповідальної особи з питань захисту. Напишіть на {{contact.email}} і вкажіть у темі листа слово «Захист». Доказів не потрібно. Повідомити можна про будь-кого, зокрема про наших працівників, волонтерів і водіїв. Ми зв’яжемося з вами того ж дня, а ваше повідомлення побачать лише ті, хто має діяти.

## Якщо комусь загрожує небезпека просто зараз

{{help.emergency}}`,
    },
  },
  {
    id: 'policy.complaints', mode: 'rich', label: 'Complaints',
    defaults: {
      'en-GB': `## Tell us

If something has gone wrong, please tell us. A complaint helps us put things right. Write to {{contact.email}} or call {{contact.phone}}, in Ukrainian or English. You do not need an account, and someone else can complain for you, such as a neighbour, a relative or a social worker.

Complaining never affects your access to help, or anyone else's.

## What happens next

- Within 1 hour, we confirm that we have your complaint.
- Within 2 working days, a person contacts you. If it is about someone's safety, we contact you the same day.
- Within 10 working days, we aim to put things right.
- If the complaint is about money, safety or a senior person, a specialist or our director deals with it within 20 working days.
- If something about you was published without your agreement, we take it down within 1 hour, before we look into it.

Your complaint is never handled by the person it is about. You can also ask for a different coordinator.

## If you are still not satisfied

You can ask for an independent review by someone who was not involved. We arrange it within 15 working days and send you the decision within 30 working days.

You can also go to an independent body at any time:

- For anything about personal data, you can complain to {{org.privacyAuthority}}.
- For how we are run or how we raise money, contact the public body that oversees organisations like ours. Our registration: {{org.registration}}.`,
      uk: `## Розкажіть нам

Якщо щось пішло не так, будь ласка, розкажіть нам. Скарга допомагає нам усе виправити. Напишіть на {{contact.email}} або зателефонуйте за номером {{contact.phone}} — українською чи англійською. Реєстрація не потрібна, а поскаржитися від вашого імені може хтось інший: сусід, родичка чи соціальний працівник.

Скарга ніколи не вплине на те, чи отримаєте допомогу ви або будь-хто інший.

## Що буде далі

- Протягом 1 години ми підтвердимо, що отримали вашу скаргу.
- Протягом 2 робочих днів із вами зв’яжеться людина. Якщо йдеться про чиюсь безпеку — того ж дня.
- Протягом 10 робочих днів ми прагнемо все виправити.
- Якщо скарга стосується грошей, безпеки чи когось із керівників, її розгляне фахівець або керівник організації протягом 20 робочих днів.
- Якщо про вас щось опублікували без вашої згоди, ми приберемо це протягом 1 години — ще до того, як почнемо розбиратися.

Вашу скаргу ніколи не розглядає людина, на яку ви скаржитеся. Ви також можете попросити іншого координатора.

## Якщо відповідь вас не влаштовує

Ви можете попросити про незалежний розгляд: його проведе людина, яка не була причетна до справи. Ми організуємо його протягом 15 робочих днів, а рішення надішлемо протягом 30 робочих днів.

Також будь-коли можна звернутися до незалежних органів:

- Якщо йдеться про ваші дані: {{org.privacyAuthority}}.
- Якщо йдеться про те, як ми працюємо чи збираємо кошти: державний орган, що наглядає за такими організаціями, як наша. Наша реєстрація: {{org.registration}}.`,
    },
  },
  {
    id: 'policy.accessibility', mode: 'rich', label: 'Accessibility statement',
    defaults: {
      'en-GB': `## Our aim

We want everyone to be able to use this website, including people who use a screen reader or only a keyboard, and people with an old phone and a weak signal. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.

## What works

- You can use every page with a keyboard alone. A link at the top lets you skip straight to the main content.
- Headings, form labels and buttons are marked up so that screen readers can read them.
- If you have asked your device to reduce motion, animations are switched off.
- Every page is available in Ukrainian and English.
- The form for asking for help works even if JavaScript is switched off or does not load.

## Known problems

- On small screens, the labels on the river drawing on the home page are hidden. The drawing is decorative, and the text of the page explains the same steps.
- Some notes and captions are in small text. You can zoom in with your browser.

## Ask for another format

If you need something from this website in another format, such as large print, easy read or a phone call, write to {{contact.email}} or call {{contact.phone}}. Tell us what you need and how to reach you. We will reply within {{help.replyWithinDays}} days.

## Tell us about a problem

If any part of this website is hard or impossible for you to use, please tell us in the same way. Every report helps us fix it. We aim to review this statement at least once a year and after every major change.`,
      uk: `## Наша мета

Ми хочемо, щоб цим сайтом могли користуватися всі — зокрема люди, які працюють із програмою зчитування з екрана чи лише з клавіатурою, а також ті, в кого старий телефон і слабкий зв’язок. Ми прагнемо відповідати Настановам з доступності вебконтенту (WCAG) 2.2 на рівні AA.

## Що працює

- Кожною сторінкою можна користуватися лише з клавіатури. Посилання на початку сторінки дає змогу одразу перейти до основного змісту.
- Заголовки, підписи полів і кнопки розмічено так, щоб їх могли прочитати програми зчитування з екрана.
- Якщо на вашому пристрої ввімкнено зменшення руху, анімації вимикаються.
- Кожна сторінка доступна українською та англійською.
- Форма звернення по допомогу працює, навіть якщо JavaScript вимкнено або він не завантажився.

## Відомі проблеми

- На малих екранах підписи на кресленні ріки на головній сторінці приховано. Креслення декоративне, а ті самі кроки пояснено в тексті сторінки.
- Деякі примітки й підписи набрано дрібним шрифтом. Їх можна збільшити в браузері.

## Інший формат

Якщо вам потрібна інформація з цього сайту в іншому форматі — наприклад, великим шрифтом, простою мовою чи в телефонній розмові, — напишіть на {{contact.email}} або зателефонуйте за номером {{contact.phone}}. Розкажіть, що вам потрібно і як із вами зв’язатися. Ми відповімо протягом {{help.replyWithinDays}} днів.

## Повідомте про проблему

Якщо вам складно чи неможливо користуватися якоюсь частиною сайту, будь ласка, повідомте нам так само. Кожне повідомлення допомагає нам виправити проблему. Ми прагнемо переглядати цю заяву щонайменше раз на рік і після кожної великої зміни.`,
    },
  },
  {
    id: 'faq.body', mode: 'rich', label: 'Questions and answers',
    defaults: {
      'en-GB': `## Who can ask for help?

Anyone, at any time, whatever has happened before. You can ask for yourself or for someone else, such as a neighbour, a relative or a village school. Children are always represented by an adult or an institution.

## Do I need an account?

No. Tell us one way to reach you: a phone number, an e-mail address or a messenger username. After you send your request, you get a private link to follow it. A coordinator will reply within {{help.replyWithinDays}} days.

## Do I have to prove that I deserve help?

No. We take your request at face value. Sometimes a coordinator calls to check a detail, especially for something expensive. Nobody has to describe their suffering to get help.

## What if you cannot help me?

We will not simply say no. We will tell you who else can help, or put your request on hold and explain why and when we will look at it again. If you no longer need help, just tell us.

## What can I give?

Money, goods, space in a vehicle, a service such as a repair, or your time. Tell us what you would like to give, and a coordinator will write to you. If we cannot use something right now, we will say so, with thanks, and suggest what would help.

## Do you see my card details?

No. We never ask for card details on this website. After you tell us about your gift, we send you instructions for paying safely. If anyone asks for your card details in our name by phone or message, do not share them.

## Will I know where my gift went?

Yes. Each campaign page shows what was raised and what was spent, line by line, including delivery. Our reports follow each delivery from the request to the moment it arrived, without names. Costs are part of the help, so we show them openly.

## Can I give without my name being shown?

Yes. Your first name appears on our pages only if you agree. We still keep your name and e-mail address privately, so that we can keep honest accounts and reply to you.

## Can I volunteer?

Yes. You can help to pack goods, call people back, check translations or drive. Write to {{contact.email}} and tell us what you can do and when. A coordinator will suggest a task that suits you.

## I drive for you. How are my costs covered?

Each trip has a budget agreed before you set off. Keep your receipts, for example for fuel, parking or tolls, and send photos of them to your coordinator. Costs are approved and paid back from the campaign, and every approved cost appears in our public figures. You can also choose not to be paid back, and we will record the cost as your gift.

## Who sees my personal details?

Only the coordinators working on your request or your gift. Our public pages show places only at oblast level, and never names or contact details. Nothing about you is published unless you agree, one item at a time.

## Can I change my mind or ask you to delete my data?

Yes. You can withdraw any consent at any time, and we will take down what was published with it. To ask us to delete your data, write to {{contact.email}}. If the law makes us keep a record, for example of a gift for our accounts, we will tell you what we keep and for how long.`,
      uk: `## Хто може попросити про допомогу?

Будь-хто і будь-коли, що б не траплялося раніше. Можна просити для себе або для когось іншого — сусідки, родича чи сільської школи. Від імені дітей завжди звертається дорослий або заклад.

## Чи потрібно реєструватися?

Ні. Вкажіть один спосіб зв’язатися з вами: номер телефону, електронну адресу або ім’я користувача в месенджері. Надіславши звернення, ви отримаєте особисте посилання, щоб стежити за ним. Координатор відповість протягом {{help.replyWithinDays}} днів.

## Чи треба доводити, що я заслуговую на допомогу?

Ні. Ми віримо вашим словам. Іноді координатор телефонує, щоб уточнити подробиці, — особливо коли йдеться про щось дороге. Нікому не треба розповідати про свої страждання, щоб отримати допомогу.

## Що буде, якщо ви не зможете допомогти?

Ми не відмовимо просто так. Ми підкажемо, хто ще може допомогти, або відкладемо звернення й пояснимо, чому і коли повернемося до нього. Якщо допомога вже не потрібна, просто повідомте нам.

## Чим я можу поділитися?

Грошима, речами, місцем в автомобілі, послугою (наприклад, ремонтом) або своїм часом. Розкажіть, що хочете передати, і координатор вам напише. Якщо щось зараз не знадобиться, ми чесно про це скажемо, подякуємо й підкажемо, що допомогло б.

## Чи бачите ви дані моєї картки?

Ні. На цьому сайті ми ніколи не просимо даних картки. Коли ви повідомите нам про дар, ми надішлемо інструкцію, як безпечно його передати. Якщо хтось від нашого імені просить дані картки телефоном чи в повідомленні, не діліться ними.

## Чи дізнаюся я, куди пішов мій дар?

Так. На сторінці кожної кампанії видно, скільки зібрано і на що витрачено, — рядок за рядком, разом із доставкою. Наші звіти простежують кожну доставку від звернення до моменту, коли допомога дійшла, — без імен. Витрати теж частина допомоги, тому ми показуємо їх відкрито.

## Чи можна дарувати, не показуючи свого імені?

Так. Ваше ім’я з’явиться на наших сторінках, лише якщо ви на це погодитеся. Проте ми зберігаємо ваше ім’я та електронну адресу приватно, щоб вести чесний облік і мати змогу вам відповісти.

## Чи можна долучитися до волонтерства?

Так. Можна пакувати речі, передзвонювати людям, перевіряти переклади чи возити допомогу. Напишіть на {{contact.email}}, що ви вмієте і коли маєте час. Координатор запропонує справу, яка вам підійде.

## Я вожу допомогу. Хто покриває мої витрати?

Бюджет кожної поїздки погоджують до виїзду. Зберігайте чеки — наприклад, за пальне, паркування чи платні дороги — і надсилайте їхні фото координаторові. Витрати затверджують і відшкодовують із коштів кампанії, а кожна затверджена витрата потрапляє в наші публічні цифри. Ви також можете відмовитися від відшкодування — тоді ми запишемо цю витрату як ваш дар.

## Хто бачить мої персональні дані?

Лише координатори, які працюють із вашим зверненням чи даром. Публічні сторінки показують місця лише з точністю до області й ніколи не показують імен чи контактів. Нічого про вас не публікують без вашої згоди — окремої для кожного випадку.

## Чи можу я передумати або попросити видалити мої дані?

Так. Ви можете будь-коли відкликати згоду, і ми приберемо все, що було опубліковано на її підставі. Щоб попросити видалити ваші дані, напишіть на {{contact.email}}. Якщо закон зобов’язує нас зберігати якийсь запис, наприклад про дар для бухгалтерського обліку, ми пояснимо, що саме зберігаємо і як довго.`,
    },
  },
];
