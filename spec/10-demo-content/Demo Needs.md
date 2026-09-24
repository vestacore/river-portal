---
type: demo
status: draft
tags: [demo, needs, i18n, privacy/sensitive, seed]
aliases: [Demo Requests, Seed Needs]
related: ["[[Need]]", "[[Help Seeker Section]]", "[[Lifecycle of a Need]]"]
---

# Demo Needs

Fifteen fictional [[Need]]s covering every form (goods, money for a local purchase, service, transport), every kind of asker (self, on behalf of others, institution) and the side states (referred, withdrawn, on hold). Each is given as the asker wrote it, in both languages. Back to [[Demo Content Overview]].

> [!privacy] How to read these
> The text below is the **`private`** view that the asker and assigned coordinator see. The `participants` and `public` columns show what the projections produce after redaction ([[Visibility Levels#Redaction rules per projection]]). Personal names in the seed live only in `people.yaml`; need text is PII-scrubbed on import.

## Summary

| ID | Short title | Form | Asked by | Oblast | Scenario | Seed end state |
|---|---|---|---|---|---|---|
| N-0142 | Generator for a grandmother and grandson | goods | self (by phone) | Kharkiv | A | closed |
| N-0143 | Generator and blankets for a village school | goods | institution | Kharkiv | A | closed |
| N-0144 | Hygiene kits and power banks for one street | goods | village head, on behalf of 11 households | Kharkiv | A | closed |
| N-0201 | Gas cooker for a family that recently moved | goods | self | Dnipropetrovsk | B | closed |
| N-0202 | Water filtration for a district hospital | goods | institution | Dnipropetrovsk | B | closed |
| N-0203 | Lifts to hospital appointments | transport service | neighbour, on behalf of | Dnipropetrovsk | B | referred |
| N-0204 | School shoes for three children | goods | self (parent) | Lviv | B | closed |
| N-0205 | Entrance ramp for a wheelchair user | service | self | Lviv | B | open (on_hold → open) |
| N-0206 | Burners for a community kitchen | money for local purchase | partner organisation | Dnipropetrovsk | B | closed |
| N-0207 | Solar power station for a warm space | goods | institution | Kharkiv | C | closed |
| N-0208 | Keeping insulin cold during power cuts | goods | daughter, on behalf of her mother | Dnipropetrovsk | C | closed |
| N-0209 | Firewood for six households | money for local purchase | village head, on behalf of | Kharkiv | C | in_delivery |
| N-0210 | Help restoring property documents | service | self | Kharkiv | C | referred |
| N-0211 | Washing machine | goods | self | Dnipropetrovsk | C | withdrawn |
| N-0212 | Generator fuel for a hospital | money for local purchase | institution | Kharkiv | C | partially_matched |

(Fifteen rows: N-0142–0144 are the three needs of [[Scenario A — Transport Fundraiser]]; the twelve N-02xx needs are the core set.)

## Needs in detail

### N-0142 · Generator for a grandmother and grandson
| | en-GB | uk |
|---|---|---|
| Asker's words | I look after my grandson. When the power goes, the house is cold and dark and my insulin must stay in the fridge. A small generator would help us a lot. | Я доглядаю онука. Коли зникає світло, в хаті холодно й темно, а мій інсулін має стояти в холодильнику. Невеликий генератор дуже б нам допоміг. |
| What / form | Petrol generator, 2–3 kW · goods | Бензиновий генератор, 2–3 кВт · речі |
| Where / when | A village in Kharkiv oblast · before the end of February | Село на Харківщині · до кінця лютого |
| Participants see | A grandmother caring for her grandson in Kharkiv oblast received a generator. | Бабуся, яка доглядає онука на Харківщині, отримала генератор. |
| Visibility | health detail `private`; child's details `sealed`; category and oblast `participants` | |

### N-0143 · Generator and blankets for a village school
| | en-GB | uk |
|---|---|---|
| Asker's words | Our school has 34 pupils. During outages we cannot keep classrooms warm or run the computers for online lessons. We need a generator and about 20 warm blankets. | У нашій школі 34 учні. Під час відключень ми не можемо ні обігріти класи, ні вмикати комп'ютери для онлайн-уроків. Потрібен генератор і близько 20 теплих ковдр. |
| What / form | Generator + 20 blankets · goods | Генератор + 20 ковдр · речі |
| Where / when | Village school, Kharkiv oblast · as soon as possible | Сільська школа, Харківщина · якнайшвидше |
| Asked by | Head teacher (authorised officer) | Директорка школи (уповноважена особа) |
| Public | "A village school in Kharkiv oblast" — no pupils named or photographed | «Сільська школа на Харківщині» — без імен і фото учнів |

### N-0144 · Hygiene kits and power banks for one street
| | en-GB | uk |
|---|---|---|
| Asker's words | I am the head of our village. Eleven households on one street, mostly older people, have asked for hygiene kits and something to charge their phones. I have a list with their consent. | Я староста нашого села. Одинадцять родин з однієї вулиці, здебільшого літні люди, просять гігієнічні набори й щось, щоб заряджати телефони. Маю список, погоджений з ними. |
| What / form | 60 hygiene kits, 12 power banks · goods | 60 гігієнічних наборів, 12 павербанків · речі |
| Where / when | Kharkiv oblast · this month | Харківщина · цього місяця |
| Note | Each household's details are held separately; the village head consents only for himself | Дані кожної родини зберігаються окремо; староста дає згоду лише щодо себе |

### N-0201 · Gas cooker for a family that recently moved
| | en-GB | uk |
|---|---|---|
| Asker's words | We moved to Dnipro in March and rent a small flat. There is a gas pipe but no cooker. We are four, and we cook on one electric ring. | Ми переїхали до Дніпра в березні й орендуємо невелику квартиру. Газ підведено, але плити немає. Нас четверо, готуємо на одній електроплитці. |
| What / form | Gas cooker with installation · goods + service | Газова плита з підключенням · річ + послуга |
| Where / when | Dnipro · within a month | Дніпро · протягом місяця |
| Participants see | A household that recently moved to Dnipro received a cooker. | Родина, яка нещодавно переїхала до Дніпра, отримала плиту. |

### N-0202 · Water filtration for a district hospital
| | en-GB | uk |
|---|---|---|
| Asker's words | The water supply to our hospital is unstable and the quality has fallen. Our filtration unit works, but we have run out of replacement cartridges. | Водопостачання лікарні нестабільне, якість води погіршилася. Наша система фільтрації працює, але закінчилися змінні картриджі. |
| What / form | 160 cartridges, type specified by the hospital · goods | 160 картриджів, тип вказала лікарня · речі |
| Where / when | District hospital, Dnipropetrovsk oblast · urgent | Районна лікарня, Дніпропетровщина · терміново |
| Asked by | Deputy director | Заступниця директора |
| Public | Named publicly after institutional consent (DP-12) | Назва оприлюднена після згоди закладу (DP-12) |

### N-0203 · Lifts to hospital appointments
| | en-GB | uk |
|---|---|---|
| Asker's words | My neighbour is 81 and lives alone. He has check-ups at the heart clinic in the city twice a month and there is no bus from our village any more. Can someone drive him? | Моєму сусідові 81 рік, він живе сам. Двічі на місяць він має їздити на огляд до кардіолога в місті, а автобус із нашого села більше не ходить. Чи може хтось його підвозити? |
| What / form | Regular transport · service | Регулярне підвезення · послуга |
| Outcome | Referred to Kryla's volunteer transport service, with the neighbour's and the man's consent | Передано волонтерській службі перевезень «Крил громади» за згодою сусіда та самого чоловіка |
| Message sent | We can't drive him ourselves, but our partners in Dnipro can. Serhiy will call you tomorrow. | Ми не можемо возити його самі, але наші партнери в Дніпрі можуть. Сергій зателефонує вам завтра. |

### N-0204 · School shoes for three children
| | en-GB | uk |
|---|---|---|
| Asker's words | I have three children, aged 7, 10 and 13. They have grown out of their shoes and school starts soon. | У мене троє дітей — 7, 10 і 13 років. Вони виросли зі свого взуття, а скоро до школи. |
| What / form | 3 pairs of shoes, sizes given · goods | 3 пари взуття, розміри вказано · речі |
| Where / when | Lviv · before 1 September | Львів · до 1 вересня |
| Visibility | Children's ages and sizes `sealed`; team sees "3 pairs of children's shoes" | Вік і розміри дітей — `sealed`; команда бачить «3 пари дитячого взуття» |

### N-0205 · Entrance ramp for a wheelchair user
| | en-GB | uk |
|---|---|---|
| Asker's words | I use a wheelchair. There are three steps at the entrance to our building, so I cannot go out on my own. A simple ramp would change my life. | Я користуюся кріслом колісним. Біля входу в під'їзд три сходинки, тож сам я вийти не можу. Простий пандус змінив би моє життя. |
| What / form | Building a ramp · service (volunteer carpenters) + materials | Зведення пандуса · послуга (волонтери-теслі) + матеріали |
| Where / when | Lviv · summer | Львів · влітку |
| Status note | On hold until the building manager agreed; now open, volunteers scheduled | Було на паузі до згоди ОСББ; тепер відкрито, волонтерів заплановано |

### N-0206 · Burners for a community kitchen
| | en-GB | uk |
|---|---|---|
| Asker's words | Our kitchen cooks about 300 hot meals a day for people who have moved to Dnipro. Two of our gas burners have failed. They can be bought locally. | Наша кухня готує близько 300 гарячих обідів на день для людей, які переїхали до Дніпра. Два газові пальники вийшли з ладу. Їх можна купити тут, на місці. |
| What / form | UAH 24,000 for 2 burners · money for local purchase | 24 000 UAH на 2 пальники · кошти на місцеву закупівлю |
| Asked by | Kryla Community Foundation (partner) | БФ «Крила громади» (партнер) |

### N-0207 · Solar power station for a warm space
| | en-GB | uk |
|---|---|---|
| Asker's words | Our village warm space is in the old library. People come to warm up, charge phones and see each other. We need a power station with solar panels so we can stay open during long outages. | Наш сільський пункт обігріву — у старій бібліотеці. Люди приходять погрітися, зарядити телефони й побачитися. Потрібна зарядна станція із сонячними панелями, щоб працювати під час довгих відключень. |
| What / form | Power station 2 kWh + 2 panels · goods | Зарядна станція 2 кВт·год + 2 панелі · речі |
| Where / when | Kharkiv oblast · before November | Харківщина · до листопада |

### N-0208 · Keeping insulin cold during power cuts
| | en-GB | uk |
|---|---|---|
| Asker's words | I am writing for my mother, who is 74. She needs insulin, and when the power is off for many hours we are afraid it will spoil. | Пишу від імені мами, їй 74 роки. Вона на інсуліні, і коли світла немає багато годин, ми боїмося, що ліки зіпсуються. |
| What / form | Insulin cooling case + power bank · goods | Термокейс для інсуліну + павербанк · речі |
| Visibility | Health detail `private`; the mother consents via her daughter by phone; never in any story | Медичні дані — `private`; мама дає згоду через доньку телефоном; жодних історій |

### N-0209 · Firewood for six households
| | en-GB | uk |
|---|---|---|
| Asker's words | Six households in our village heat with wood stoves. Their woodsheds are almost empty. A local supplier can deliver 3 m³ to each house. | Шість родин у нашому селі опалюють будинки дровами. Дров майже не залишилося. Місцевий постачальник може привезти по 3 м³ на кожне подвір'я. |
| What / form | 18 m³ of firewood · money for local purchase | 18 м³ дров · кошти на місцеву закупівлю |
| Asked by | Village head, on behalf of six households | Староста від імені шести родин |

### N-0210 · Help restoring property documents
| | en-GB | uk |
|---|---|---|
| Asker's words | Our house was damaged and the documents were lost. I need to apply for compensation but don't know where to start. | Наш будинок пошкоджено, документи загубилися. Мені треба подати заяву на компенсацію, але я не знаю, з чого почати. |
| Outcome | Referred to a free legal aid partner | Передано партнерській службі безоплатної правової допомоги |

### N-0211 · Washing machine
| | en-GB | uk |
|---|---|---|
| Asker's words | We have a baby and no washing machine. | У нас немовля, а пральної машини немає. |
| Outcome | Withdrawn by the asker: "We moved to relatives, thank you." | Відкликано: «Ми переїхали до родичів, дякуємо». |
| Reply | Thank you for letting us know. If you need anything in your new home, you can always ask again. | Дякуємо, що повідомили. Якщо на новому місці щось знадобиться, звертайтеся знову будь-коли. |

### N-0212 · Generator fuel for a hospital
| | en-GB | uk |
|---|---|---|
| Asker's words | Our hospital generator uses about 400 litres of diesel a week during outages. We can buy fuel locally if we have the money. | Під час відключень наш лікарняний генератор витрачає близько 400 літрів дизпалива на тиждень. Ми можемо купити пальне на місці, якщо будуть кошти. |
| What / form | UAH 25,000 per week, for 6 weeks · money for local purchase | 25 000 UAH на тиждень протягом 6 тижнів · кошти на місцеву закупівлю |
| State | Partially matched: 3 of 6 weeks funded | Частково забезпечено: 3 з 6 тижнів |

## Related
[[Need]] · [[Recipient]] · [[Help Seeker Section]] · [[DP-01 Need Triage]] · [[DP-02 Need Verification]] · [[Lifecycle of a Need]] · [[Data Minimisation]]
