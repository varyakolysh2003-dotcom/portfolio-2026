// English and Russian copy adapted from the linked Banco Plata Figma case.
export const translations = [
  [
    "User & Business Value",
    "Польза для пользователей и бизнеса"
  ],
  [
    "For users: find an ATM that meets their needs without external apps, and access their account without a physical card or concerns about security. The ATM now supports the new flow and a video guide to using a QR code.",
    "У пользователей: Способ поиска подходящего по их требованиям банкомата без внешних приложений, возможность взаимодействовать с счетом без физической карты и страха за безопасность. Банкомат теперь поддерживает новый сценарий и видео инструкцию использования QR-кода."
  ],
  [
    "Business goal: help customers complete their tasks without always having a physical card at hand, make cash withdrawals more convenient, simplify the process, and minimize support requests.",
    "Цель бизнеса: помочь клиентам выполнять свои задачи без постоянного наличия физической карты под рукой, сделать снятие наличных более удобным, упростить процесс и свести к минимуму количество обращений в службу поддержки."
  ],
  [
    "Hypotheses | JTBD and user survey",
    "Гипотезы | JTBD и опрос пользователей"
  ],
  [
    "I formulated hypotheses for the entire user journey:",
    "Сформулировала гипотезы для всего пути пользователя:"
  ],
  [
    "a clear entry point would help users find the feature faster;",
    "понятная точка входа поможет быстрее дойти до сценария;"
  ],
  [
    "nearby ATMs with addresses and availability would reduce unsuccessful visits;",
    "ближайшие банкоматы с адресом и доступностью снизят число неудачных попыток;"
  ],
  [
    "transaction details and QR code expiry information would build confidence and reduce duplicates;",
    "детали операции и срок действия QR-кода повысят уверенность и уменьшат дубли;"
  ],
  [
    "clear statuses and errors would reduce support requests.",
    "понятные статусы и ошибки сократят обращения в поддержку."
  ],
  [
    "Using JTBD, I divided the tasks into three stages: before withdrawal, at the ATM, and after withdrawal.",
    "Через JTBD разложила задачи на три этапа: до снятия, у банкомата и после снятия."
  ],
  [
    "To explore these hypotheses, I surveyed 7 people who had already withdrawn cash without a card:",
    "Чтобы проверить гипотезы, провела количественный опрос среди 7 человек, которые уже снимали наличные без карты:"
  ],
  [
    "6 of 7 looked for ATMs in external map apps;",
    "6 из 7 ищут банкоматы во внешних картах;"
  ],
  [
    "opening hours were the main criterion when choosing an ATM, followed by fees;",
    "при выборе банкомата главное — часы работы, затем комиссия;"
  ],
  [
    "4 of 7 had encountered an out-of-service ATM in the past year;",
    "4 из 7 за последний год попадали на неработающий банкомат;"
  ],
  [
    "5 of 7 worried that someone else could use their QR code.",
    "5 из 7 боятся, что их QR-кодом воспользуется кто-то другой."
  ],
  [
    "Benchmarking",
    "Анализ аналогов"
  ],
  [
    "I reviewed existing solutions from Russian and Mexican banks, focusing on:",
    "В процессе анализа посмотрела существующие решения среди Российских и мексиканских банков. Во время погружения смотрела на:"
  ],
  [
    "entry points for generating or scanning QR codes and finding ATMs;",
    "Точки входа для генерации или сканирования QR-кода и поиска банкоматов;"
  ],
  [
    "ATM search and information on the map;",
    "Поиск и описание банкоматов на карте;"
  ],
  [
    "how cash withdrawals work without a physical card.",
    "Как происходит процесс обналичивания без участия физической карты."
  ],
  [
    "Key findings",
    "Главные выводы"
  ],
  [
    "Banks approach cardless withdrawals differently. Some ask users to scan a QR code on the ATM screen; others ask them to hold their own code up to a scanner.",
    "Все банки по-разному подходят к процессу обналичивания без участия карты. Часть банков предлагает сканировать кюар кода с экрана банкомата, другая — приложить кюар код к месту сканирования."
  ],
  [
    "Plata ATMs already have a QR scanner, so I prioritized:",
    "У банкомата Платы уже есть место под сканирование кюар кода, поэтому для своего решения главными преимущественными решениями я выбрала:"
  ],
  [
    "security and step-by-step statuses across the ATM and phone during the transaction;",
    "Безопасность и пошаговость статусов между банкоматом и телефоном в процессе операции;"
  ],
  [
    "detailed ATM information before the user leaves home;",
    "Важность подробной информации о банкомате до момента, пока пользователь не выйдет из дома;"
  ],
  [
    "secure control of a QR code after it is generated;",
    "Безопасность контроля QR-кода после его генерации;"
  ],
  [
    "instructions for using a QR code at the ATM.",
    "Инструкция использования кюар кода на моменте пользования банкоматом."
  ],
  [
    "User flow",
    "Пользовательский путь"
  ],
  [
    "I built the flow around three stages of the user journey:",
    "Собрала флоу из трёх итераций, которые повторяют путь пользователя:"
  ],
  [
    "mobile banking: finding the feature and generating a QR code;",
    "мобильный банк: точка входа и генерация QR-кода;"
  ],
  [
    "finding an ATM and checking its information;",
    "поиск банкомата и информация о нём;"
  ],
  [
    "withdrawing cash at the ATM.",
    "снятие наличных на самом банкомате."
  ],
  [
    "For each stage, I mapped the transitions and edge cases.",
    "Для каждой итерации прописала переходы и edge сценарии."
  ],
  [
    "Entry points",
    "Точки входа"
  ],
  [
    "The survey and benchmarking showed that users look for withdrawals in different places. I added several entry points: a Cardless withdraw card on the home screen, a Cash actions block on the Payments screen, and search.",
    "По опросу и бенчмаркингу пользователи ищут снятие в разных местах. Поэтому точек входа несколько: карточка «Cardless withdraw» на главной, блок «Cash actions» на экране Payments и поиск по запросу."
  ],
  [
    "Cash actions brings together two related tasks: withdrawing cash with a QR code and finding an ATM on the map.",
    "Блок «Cash actions» объединяет два связанных действия: снять наличные по QR и найти банкомат на карте."
  ],
  [
    "QR code generation",
    "Генерация QR-кода"
  ],
  [
    "Everything is on one screen: account selection with the available balance, amount entry, and suggested amounts. A hint immediately explains that the amount must be a multiple of $50.",
    "Всё нужное собрано на одном экране: выбор счёта с балансом, ввод суммы и быстрые суммы. Подсказка сразу говорит, что сумма должна быть кратна $50."
  ],
  [
    "Plata ATM terms and the daily limit appear below the button. Survey participants said they needed this information before withdrawing cash.",
    "Под кнопкой показаны условия в банкоматах Plata и дневной лимит. Именно эту информацию пользователи в опросе назвали нужной до снятия."
  ],
  [
    "Generated QR code",
    "Сгенерированный QR-код"
  ],
  [
    "Alongside the code, the screen shows the account, amount, expiry time, and a link to nearby ATMs. Users can save the code as an image for later.",
    "Кроме самого кода, на экране видны счёт списания, сумма, срок действия и ссылка на ближайшие банкоматы. Код можно сохранить картинкой и использовать позже."
  ],
  [
    "Users can cancel the code at any time to stay in control of its security. Cancellation and generation errors have dedicated bottom sheets with clear explanations and actions.",
    "Чтобы человек контролировал безопасность, код можно отменить в любой момент. Для отмены и ошибки генерации есть отдельный bottom sheet с понятным текстом и действием."
  ],
  [
    "After generating a QR code",
    "После генерации QR-кода"
  ],
  [
    "Generated codes remain easy to find: an Active QR codes block appears on the Payments screen with the amount, account, and expiry time.",
    "Созданные коды не теряются, на экране Payments появляется блок «Active QR codes» с суммой, счётом и сроком действия."
  ],
  [
    "Users can see which codes are still active and return to them before visiting an ATM. This reduces duplicate codes and uncertainty about control of their money after generation.",
    "Пользователь всегда видит, какие коды ещё действуют, и может вернуться к ним до похода к банкомату. Это снижает число дублей и неопределенности за контроль средств после генерации кюар кода."
  ],
  [
    "ATMs on the map and filters",
    "Банкоматы на карте и фильтры"
  ],
  [
    "ATMs appear on a map and in a list with distances and opening hours. Out-of-service ATMs are visually distinct, helping users choose an ATM within the banking app.",
    "Банкоматы показаны на карте и списком с расстоянием и часами работы, а неработающие визуально отличаются. Так человек выбирает банкомат прямо в приложении, без внешних карт."
  ],
  [
    "Filters reflect the survey and benchmarking criteria: opening hours, withdrawal method (QR or card), cash availability, currency, and payment networks.",
    "Фильтры построены по критериям из опроса и бенчмаркинга: часы работы, способ снятия (QR или карта), наличие наличных, валюта и платёжные системы."
  ],
  [
    "ATM information",
    "Информация о банкомате"
  ],
  [
    "The ATM card contains everything users need to know before leaving home.",
    "В карточке есть всё, что нужно знать до выхода из дома."
  ],
  [
    "Users can open the address in Google Maps or share it. The card also links to instructions and support.",
    "Адрес можно открыть в Google Maps или отправить. Из карточки также можно перейти к инструкции и написать в поддержку."
  ],
  [
    "Service instructions",
    "Инструкции по операциям"
  ],
  [
    "Short, step-by-step instructions explain cash withdrawals and deposits: what to tap on the ATM, where to hold the code, and what happens next.",
    "Для снятия и внесения наличных есть короткие пошаговые инструкции: что нажать на банкомате, куда поднести код и что делать дальше."
  ],
  [
    "Instructions open directly from the ATM card, so users can understand the process in advance.",
    "Инструкции открываются прямо из карточки банкомата, поэтому разобраться в процессе можно заранее, а не стоя у банкомата."
  ],
  [
    "Cardless withdrawal at the ATM",
    "Снятие без карты в банкомате"
  ],
  [
    "I designed the ATM interface to follow the same logic as the app: start with Deposit or Withdraw, then choose By QR code or By Card.",
    "Интерфейс банкомата спроектировала в той же логике, что и приложение: на старте два действия — Deposit и Withdraw, затем выбор способа — «By QR code» или «By Card»."
  ],
  [
    "Language and support buttons are available at every step.",
    "Кнопки смены языка и поддержки доступны на каждом шаге."
  ],
  [
    "Video guidance during scanning",
    "Видеоинструкция при сканировании"
  ],
  [
    "During scanning, an animation shows where to hold the phone. This is the step that most often raises questions.",
    "Пока идёт сканирование, анимация показывает, куда подносить телефон. Именно здесь сценарий чаще всего вызывает вопросы."
  ],
  [
    "Statuses progress from Hold the code up to Processing your code. Users understand what is happening and know to stay at the ATM.",
    "Статусы сменяют друг друга по шагам: «Поднесите код» → «Обрабатываем код». Пользователь понимает, что происходит, и не уходит от банкомата раньше времени."
  ],
  [
    "Amount entry",
    "Ввод суммы"
  ],
  [
    "After scanning, the screen shows the card and amount from the QR code, with a balance check and the option to request smaller notes. It also clearly states that there is no fee.",
    "После сканирования видны карта и сумма из QR-кода, есть проверка баланса и выбор мелких купюр. Отдельно показано, что комиссии нет."
  ],
  [
    "Users can go back or exit at any time, staying in control of the transaction until confirmation.",
    "В любой момент можно вернуться назад или выйти — человек контролирует операцию до самого подтверждения."
  ],
  [
    "Preparing and collecting cash",
    "Подготовка и выдача наличных"
  ],
  [
    "Two separate statuses distinguish cash preparation from dispensing: Preparing your cash and Please take your cash.",
    "Подготовку денег и выдачу показывают два отдельных статуса: «Готовим наличные» и «Заберите наличные»."
  ],
  [
    "A banknote animation shows where to collect the money, completing the journey and easing the worry that the account was debited but no cash was dispensed.",
    "Анимация купюр показывает, где их забрать. Это закрывает последний шаг пути и снимает тревогу «списалось, а деньги не выдали»."
  ],
  [
    "Usability testing",
    "Юзабилити-тестирование"
  ],
  [
    "I conducted qualitative usability testing with 5 participants across three scenarios:",
    "Провела качественное юзабилити-тестирование на 5 респондентах в трёх сценариях:"
  ],
  [
    "generating a QR code;",
    "генерация QR-кода;"
  ],
  [
    "finding an ATM;",
    "поиск банкомата;"
  ],
  [
    "withdrawing cash at an ATM.",
    "снятие наличных на банкомате."
  ],
  [
    "I checked how easily participants found the entry point, whether the information and statuses were clear, and where doubts arose.",
    "Проверяла, легко ли найти точку входа, понятны ли информация и статусы, где возникают сомнения."
  ],
  [
    "All 5 participants completed all 3 scenarios without blockers. The map, filters, and ATM card were clear; 3 of 5 did not need instructions. Everyone found the ATM flow easy.",
    "Все 5 респондентов прошли все 3 сценария без блокеров. Карта, фильтры и карточка банкомата оказались понятными, 3 из 5 даже не понадобились инструкции. Флоу на банкомате был лёгким для всех."
  ],
  [
    "Key issues:",
    "Критические моменты:"
  ],
  [
    "3 of 5 initially looked for withdrawals on the home or account screen;",
    "3 из 5 сначала искали снятие на главной или в счёте;"
  ],
  [
    "the ATM address could not be copied;",
    "нельзя скопировать адрес банкомата;"
  ],
  [
    "the ATM did not show the limit before amount entry.",
    "на банкомате не видно лимита до ввода суммы."
  ],
  [
    "Design iterations",
    "Итерации дизайна"
  ],
  [
    "Based on testing, I made the following changes:",
    "По итогам тестирования внесла изменения:"
  ],
  [
    "added a Withdraw quick action to the home screen and Cuenta account;",
    "добавила быстрое действие Withdraw на главную и в счёт Cuenta;"
  ],
  [
    "moved Cash actions higher on the Pay screen, above Recipients and My payments;",
    "подняла блок «Cash actions» выше на экране Pay, над Recipients и My payments;"
  ],
  [
    "added Share address buttons to the ATM card;",
    "добавила кнопки «Share address» в карточку банкомата;"
  ],
  [
    "displayed the withdrawal limit below the amount field on the ATM.",
    "вывела лимит под полем суммы на банкомате."
  ],
  [
    "Cardless withdrawal in PLATA ATM",
    "Снятие наличных без карты в банкоматах PLATA"
  ],
  [
    "My role",
    "Моя роль"
  ],
  [
    "I designed the complete end-to-end journey, from finding an ATM and generating a QR code to receiving cash, and conducted usability testing to gather participant feedback.",
    "Спроектировала полный end-to-end сценарий: от поиска банкомата и генерации QR-кода до выдачи наличных. Провела юзабилити-тестирование для сбора обратной связи респондентов."
  ],
  [
    "Context",
    "Контекст"
  ],
  [
    "Plata users can withdraw cash from ATMs without a physical card using a QR code generated in the app.",
    "Пользователи Plata могут снимать наличные в банкоматах без физической карты, используя QR-код, созданный в приложении."
  ],
  [
    "Task",
    "Задача"
  ],
  [
    "Design the end-to-end QR cash withdrawal experience, from discovering the feature and finding an ATM to generating and using the QR code.",
    "Спроектировать полный сценарий снятия наличных по QR-коду: от знакомства с функцией и поиска банкомата до генерации и использования кода."
  ],
  [
    "As is",
    "Как было"
  ],
  [
    "The ATM and mobile banking app did not support cash operations without a bank card. Users had to look up ATM locations and services outside the banking app.",
    "Банкомат и мобильный банк не поддерживали операции с наличными без банковской карты. Местоположение и услуги банкоматов приходилось искать вне приложения банка."
  ],
  [
    "Pain points from as-is testing",
    "Боли пользователей по тестированию as is"
  ],
  [
    "Users depended on a physical card, external apps to find ATMs, and an internet connection. Generating a QR code raised concerns about the security of their money.",
    "Пользователи зависели от физической карты, внешних приложений для поиска банкоматов и интернета. При использовании QR-кода возникает тревога за безопасность счета."
  ],
  [
    "Desk research",
    "Кабинетное исследование"
  ],
  [
    "I analyzed user reviews and media sources, and reviewed existing banking solutions from different countries.",
    "Проанализировала отзывы пользователей и публикации в медиа, изучила существующие решения банков разных стран."
  ],
  [
    "To be",
    "Как стало"
  ],
  [
    "I designed the complete flow, including edge cases, from finding an ATM to withdrawing cash without a physical card.",
    "Спроектировала полный сценарий, включая edge случаи: от поиска банкомата до снятия наличных без физической карты."
  ],
  [
    "The flow gives users control over the security of their funds after generating a QR code.",
    "Сценарий позволяет пользователю контролировать безопасность средств после генерации QR-кода."
  ],
  [
    "The ATM provides video instructions during the transaction.",
    "Банкомат показывает видеоинструкцию во время операции."
  ],
  [
    "Banco Plata — Varvara Kolysh",
    "Banco Plata — Варвара Колыш"
  ],
  [
    "A Banco Plata product design case study: cardless cash withdrawals, QR codes, ATM discovery, and usability testing.",
    "Кейс продуктового дизайна Banco Plata: снятие наличных без карты, QR-коды, поиск банкоматов и юзабилити-тестирование."
  ],
  [
    "Case study overview",
    "Обзор кейса"
  ],
  [
    "Back to portfolio",
    "Вернуться к портфолио"
  ],
  [
    "Close case",
    "Закрыть кейс"
  ],
  [
    "Context",
    "Контекст"
  ],
  [
    "Process",
    "Процесс"
  ],
  [
    "Result",
    "Результат"
  ],
  [
    "Support",
    "Поддержка"
  ],
  [
    "Hold the generated QR code up to the scanner",
    "Поднесите QR-код к сканеру"
  ],
  [
    "Processing your QR code",
    "Обрабатываем QR-код"
  ],
  [
    "Preparing your cash for withdrawal",
    "Готовим наличные к выдаче"
  ],
  [
    "Please take your cash",
    "Заберите наличные"
  ]
];
