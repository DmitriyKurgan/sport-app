# Детерминированное приложение для персональных тренировок на 12 недель

## Научная база и требования к безопасности

Система должна опираться на две «опоры»: (1) **нормативные рекомендации по объёму/интенсивности** и (2) **архитектурно встроенные предохранители**, потому что пользователи — новички и «ранние intermediate», а риск травм и неадекватного старта у них выше, чем у опытных атлетов. Рекомендации по силовой тренировке для новичков и intermediate включают частоту 2–3 раза/нед для новичков и 3–4 раза/нед для intermediate, а также понятные правила прогрессии (например, прибавка в нагрузке на 2–10% при уверенном выполнении заданного объёма). citeturn9view1turn9view0

Для общего «каркаса» под здоровье и выносливость (даже если акцент на силовых) разумно использовать ориентиры по общей физической активности: взрослым рекомендуется 150–300 минут умеренной или 75–150 минут интенсивной аэробной активности в неделю плюс силовые упражнения на основные группы мышц минимум 2 дня/нед. citeturn0search9turn0search5turn0search1

Ключевой продуктовый вывод: **онбординг должен быть минималистичным**, но при этом обязан включать хотя бы базовый скрининг рисков. Современные подходы к предскринингу перед физической активностью смещаются от «массовых направлений к врачу» к более точному выявлению людей с известными заболеваниями/симптомами и оценке текущей активности и планируемой интенсивности. citeturn6search9turn6search3 Практически это реализуется простым блоком вопросов (семейство PAR‑Q+/аналог), который при «красных флагах» переключает пользователя в режим: *«только низкоинтенсивная активность + рекомендовать консультацию врача/квалифицированного специалиста»*. citeturn6search2turn6search12

Наконец, чтобы обеспечить «высокую персонализацию без LLM», важна стратегия **авторегуляции**: интенсивность и/или объём подстраиваются по факту выполнения, субъективной тяжести и восстановлению. Исследования и обзоры по авторегуляции (RPE/RIR, скорость штанги и др.) рассматривают её как применимый способ индивидуализации нагрузки. citeturn1search0turn1search11turn5search5

## Минимальная модель ввода пользователя

Ниже — минимальный набор полей, который даёт достаточно информации, чтобы детерминированно собрать 12‑недельный план под новичка/intermediate, не превращая онбординг в «медкарту». Основной принцип UX: **обязательные поля — только те, что изменяют программу** (частота/сплит/упражнения/нагрузку/питание). Всё остальное — опционально и может дозапрашиваться «по мере использования».

### Секции данных и логика минимизации

**Физический профиль** в минимальном виде нужен не «для красоты», а потому что без возраста/пола/роста/веса вы не сможете даже грубо оценить энергозатраты и корректно задать питание (через формулы типа Mifflin–St Jeor, доказательно применяемые в практике оценки REE). citeturn0search3turn0search19

**Тренировочный опыт** важен, потому что нормативы частоты/диапазонов повторений/прогрессии различаются для novice и intermediate (и это напрямую меняет объём и структуру недели). citeturn9view1turn9view0

**Цели** должны быть раздельно зафиксированы как (а) тренировочная цель (сила/гипертрофия/выносливость/общая ОФП) и (б) цель по массе (сушка/поддержание/набор), потому что питание и темп прогрессии нагрузки должны синхронизироваться (в дефиците чаще потребуется аккуратнее с объёмом и восстановлением). Рекомендации по безопасному темпу снижения массы указывают на постепенный подход порядка 0,5–1 кг/нед (или 1–2 фунта/нед), что полезно как «охранное ограничение» для алгоритма. citeturn4search9turn4search2turn4search4

**Ограничения** (оборудование, время, травмы/боль) — самые «высокоэффективные» поля: они мгновенно фильтруют библиотеку упражнений и определяют сплит.

**Факторы образа жизни** в минимальном MVP лучше свести к 2–3 простым прокси (сон/стресс/уровень дневной активности), потому что они позволяют детерминированно менять стресс тренировки (объём/интенсивность/делоад) и предотвращать перетренированность, не требуя датчиков.

Далее, детальные описания каждого поля (name/type/why/impact) включены в JSON‑контракт в конце (как вы и запросили), чтобы это можно было сразу отдавать в продукт/разработку без потерь контекста.

## Система телосложения и голографический аватар

### Классификация «эктоморф/мезоморф/эндоморф» без псевдонаучных обещаний

Классические «3 типа телосложения» живут в массовом фитнесе как понятный UX‑ярлык, но в современной спортивной антропометрии соматотип трактуется как **фенотип на текущий момент**, который может меняться от роста, питания, тренинга и заболеваний, и рассчитывается по компонентам (эндоморфия ↔ жировая составляющая, мезоморфия ↔ мышечная, эктоморфия ↔ линейность/тонкость). citeturn17view0turn15search11

Поэтому производственно безопасный подход:  
1) считать эти типы **интерфейсным слоем** (объясняющим пользователю стратегию нагрузки/питания),  
2) а в ядре держать **не тип**, а **численные скоринги** (adiposity / muscularity / linearity), которые определяют реальные параметры программы.

Дополнительно, современная литература описывает «гибридные» категории и правила доминирования компонентов (например, когда один компонент явно выше других; также встречаются комбинированные классы). citeturn15search20turn15search11

### Как получать тип из минимальных данных

Чтобы не требовать 10–15 антропометрических измерений, используйте двухуровневую модель:

**Уровень A (минимальный, без сантиметровой ленты):**
- рост + вес → BMI (и его динамика),
- относительная силовая (из логов тренировок, хотя бы по одному паттерну: присед/жим/тяга/подтягивания),
- частота тренировок и переносимость объёма (RIR/RPE).

**Уровень B (улучшенный, +2–3 простых замера):**
- талия, бёдра, грудь/плечи (или хотя бы талия) → распределение объёма,
- фото/скан (опционально) для визуального «фидбэка».

Почему так: соматотип опирается на морфологию и состав тела, но практическому тренировочному движку чаще нужны **прокси восстановления и реакции на объём**, которые хорошо поддерживаются мониторингом выполнения и авторегуляцией (RIR/RPE), а не «ярлыком типа». citeturn1search0turn1search11turn5search5

### Как тип влияет на нагрузку, восстановление и питание

В продуктовой логике (без биологического детерминизма) связь делайте такой:

- **Эндоморф‑доминирование (высокая adiposity‑оценка):** немного ниже стартовый тренировочный стресс, больше внимания технике, постепенный рост объёма, аккуратнее с дефицитом (не «жёсткая сушка»), выше приоритет NEAT/аэробной активности в рамках рекомендаций по общей активности. citeturn0search9turn4search9  
- **Эктоморф‑доминирование (высокая linearity‑оценка, низкая масса):** осторожнее с объёмом «в потолок» в начале, упор на прогрессию нагрузок и достаточную энергию/углеводы под тренинг, контроль набора (малый профицит). Референс по диапазонам углеводов под нагрузку — 3–12 г/кг/сут в зависимости от тренировочного объёма (важно: эта шкала шире, чем нужды силового новичка, но полезна как рамка, из которой вы выбираете под фактическую нагрузку). citeturn8search0turn8search9  
- **Мезоморф‑доминирование (высокая muscularity‑оценка):** можно быстрее повышать нагрузку при хорошей технике и восстановлении; но всё равно держать встроенные предохранители прогрессии (2–10% прибавки только при выполнении критериев). citeturn9view1turn9view0

### Голографический аватар: параметры и подходы реализации

**Параметры пропорций**, которые реально можно крутить (и которые понятны пользователю):
- рост (общий scale),
- отношение плечи/талия и талия/бёдра (силуэт),
- окружности: грудь, талия, бёдра, бедро, плечо (если пользователь вводит),
- «слой» жира/рельеф (визуальный шейдерный параметр),
- «мышечный объём» (морф‑таргет).

**Подходы реализации:**
- **WebGL (3D):** один базовый human‑mesh (glTF) + morph targets (blendshapes) для талии/плеч/бедра + «hologram shader» (сканлайны, glow, fresnel‑контур). Это лучший вариант по «вау‑эффекту» и будущей расширяемости (анимации трансформации).  
- **CSS/SVG (2D):** силуэт (SVG) + слои градиентов + анимация «скан‑луча» и шум/сетка. Быстро, дёшево, хорошо для mobile‑first, но меньше «реалистики».  
- **Гибрид:** 3D‑canvas низкого разрешения + UI‑оверхеды на CSS, чтобы сохранить производительность на телефонах.

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["webgl hologram avatar ui concept","three.js hologram shader example","fitness app body avatar silhouette ui","hologram scanline animation css"],"num_per_query":1}

## Генератор тренировок на 12 недель

### Принципиальная структура программы

Для детерминированной генерации удобно использовать «3 мезоцикла по 4 недели», где 4‑я неделя каждого блока — разгрузочная (делоад). Делoad в силовых/эстетических видах спорта описывается как запланированное снижение тренировочного стресса для управления утомлением и восстановления (в т.ч. в рамках консенсуса/практических рекомендаций по делуадингу). citeturn1search9turn1search13

Пример фаз:
- **Недели 1–3:** адаптация/техника + базовый объём  
- **Неделя 4:** разгрузка  
- **Недели 5–7:** накопление (объём↑) или гипертрофия‑ориентир  
- **Неделя 8:** разгрузка  
- **Недели 9–11:** интенсификация (интенсивность↑, объём↔/↓)  
- **Неделя 12:** разгрузка/тест/пересборка на следующий цикл

### Частота, сплиты и минимальный набор паттернов

Частота и сплит должны следовать уровню:
- novice: 2–3 тренировки/нед  
- intermediate: 3–4 тренировки/нед  
citeturn9view1turn9view0

Детерминированное правило подбора сплита:
- 3 дня → **Full Body A/B/C** (каждый день покрывает: squat/hinge + push + pull + core)  
- 4 дня → **Upper/Lower**  
- 5–6 дней → **PPL** или **Upper/Lower + аксессуары/условная ОФП**, но для «beginner→intermediate» 6‑дневка должна включаться только при хорошем восстановлении (сон/стресс/лог выполнения). Логику ограничений поддерживает концепция «не увеличивать стресс резко» и применять прогрессию дозированно. citeturn9view0turn9view1

Отдельно: даже если пользователь пришёл «в силовую», базовая «гигиена активности» полезна: ходьба/лёгкое кардио в рамках общих рекомендаций. citeturn0search9turn0search13

### Логика выбора упражнений

Сердце движка — **библиотека упражнений с тегами**:

- movementPattern: squat / hinge / horizontalPush / horizontalPull / verticalPush / verticalPull / carry / core  
- equipment: bodyweight / bands / dumbbells / barbell / machine  
- difficulty: 1–5  
- joints: knee/hip/shoulder/spine (для ограничений)  
- contraindications: список (например, «болит плечо → исключить вертикальные жимы»)  
- primaryMuscles, secondaryMuscles  
- progressionChain: «push‑up → bench press», «goblet squat → front squat», и т.д.

Алгоритм подбора:
1) определить «обязательные паттерны» на неделю по частоте,  
2) выбрать для каждого паттерна упражнение‑якорь (main lift) на 4 недели,  
3) аксессуары менять 1 раз в 1–2 недели (вариативность без слома прогрессии),  
4) отфильтровать по оборудованию и ограничениям.

### Расчёт подходов/повторений/интенсивности и прогрессия

Для новичков и intermediate имеет смысл держать «консервативный центр» диапазонов:
- для силы/общей силовой базы: примерно 60–70% 1RM и 1–3 подхода по 8–12 повторений (novice→intermediate),  
- для гипертрофии: примерно 70–85% 1RM и 1–3×8–12 для novice→intermediate. citeturn9view0turn9view1

Но чтобы **не требовать 1RM на онбординге**, используйте «режим авторегуляции» через RIR/RPE: пользователь выбирает вес, чтобы в заданном диапазоне повторов оставалось, например, 2–3 повторения «в запасе» (RIR). RIR‑модель и обзоры по авторегуляции описывают её как инструмент индивидуализации нагрузки. citeturn1search11turn1search0turn5search5

Детерминированный алгоритм прогрессии (практический и объяснимый):
- **Double progression:** задан диапазон 8–12. Пока пользователь повышает повторы при фиксированном весе, затем — прибавляет вес и возвращается к нижней границе.  
- **Правило прибавки:** увеличивать нагрузку на 2–10% когда пользователь стабильно выполняет цель и «может сделать на 1–2 повтора больше, чем нужно» (два раза подряд). citeturn9view1turn9view0  
- **Правило отката:** если не дотягивает до нижней границы диапазона при целевом RIR (или RPE слишком высокий), уменьшить вес на 2–5% или убрать 1 подход.  
- **Делоад‑недели:** снижать стресс за счёт объёма (например, −30–50% подходов) и/или интенсивности; конкретный рецепт должен быть фиксированным и понятным пользователю, а триггером могут быть и план, и признаки накопленного утомления. citeturn1search9turn1search0

Периодизация как организация фаз и циклов даёт преимущество по силовым показателям по сравнению с непериодизованными планами (в среднем/по мета‑анализам), что оправдывает включение фаз и разгрузок даже в «простой» продукт. citeturn2search0turn9view1

## Система питания с тремя уровнями

### Калории: расчёт и «предохранители»

Базовый расчёт:
1) оценить REE формулой Mifflin–St Jeor,  
2) умножить на коэффициент активности (учитывая тренировки + бытовую активность),  
3) применить цель: дефицит/поддержание/профицит. citeturn0search3turn0search19

Предохранители по снижению массы:
- безопасный и устойчивый темп снижения массы часто формулируется как ~0,5–1 кг/нед (или 1–2 фунта/нед), и это можно встроить как ограничение на размер дефицита. citeturn4search9turn4search2turn4search4  
- практическая подсказка из здравоохранительных источников: снижение энергопотребления на ~600 ккал/сут часто упоминается как ориентир для темпа 0,5–1 кг/нед (важно: индивидуальные различия и корректировка по факту). citeturn4search9turn4search1

### Макросы: минимальная, но доказательная модель

Белок:
- позиционные заявления по спортивному питанию указывают, что тренирующимся людям обычно требуется больше белка, чем нетренирующимся, и приводят практичные ориентиры, включая распределение приёмов (например, ~0,25 г/кг на приём или 20–40 г). citeturn0search6turn0search2  
- при гипокалорийном периоде у тренированных может требоваться более высокий белок для удержания безжировой массы. citeturn0search10turn0search6

Углеводы:
- современная рамка для атлетов: суточные углеводы «масштабируются» под объём нагрузки и могут варьировать очень широко (порядка 3–12 г/кг/сут), поэтому для силового новичка вы выбираете нижнюю/среднюю часть этого диапазона, а для высокообъёмных недель — сдвигаете вверх. citeturn8search0turn8search9turn8search8  
- тайминг углеводов до тренировки (например, 1–4 г/кг за 1–4 часа) часто используется как ориентир для доступности топлива (подходит не всем, но годится как опциональная «подсказка» в advanced‑режиме). citeturn3search2turn3search6

Жиры:
- «умеренная» доля жира 20–35% энергии — распространённый ориентир в диетических рекомендациях и обзорах по спортивному питанию. citeturn4search11turn3search19turn4search7

### Три уровня питания

**Budget (бюджетный):**  
Фокус — минимальная цена за грамм белка/углеводов и простота:
- базовые продукты: крупы, картофель, бобовые, яйца, курица/печень, молоко/творог, замороженные овощи, сезонные фрукты;  
- 1–2 «шаблона тарелки» на день вместо микро‑планирования;  
- минимум добавок; строгая привязка к тренировке не нужна, ключ — соблюдение калорий/белка. (Белок и распределение по приёмам можно подсказать по позиционным заявлениям.) citeturn0search6turn0search2

**Standard (средний):**  
Фокус — разнообразие, качество, удобство:
- больше источников белка (рыба/мясо/йогурт/сыры),  
- больше овощей/фруктов,  
- простые стратегии вокруг тренировки (углеводы до/после по самочувствию и нагрузке). citeturn8search0turn3search2turn3search19

**Advanced (продвинутый):**  
Фокус — максимизация восстановления/результатов при хорошем комплаенсе:
- управляемый карб‑тайминг под тяжёлые недели,  
- добавки только с доказательной базой и с учётом рисков загрязнения/качества. Консенсус по добавкам для высокопроизводительных атлетов подчёркивает необходимость тестировать добавки в тренировочном процессе и учитывать риски. citeturn8search3turn8search13  
- креатин имеет сильную доказательную базу по эффективности/безопасности как спортивная добавка (при корректном применении). citeturn3search4turn3search12

### Как питание связывается с 12‑недельным тренингом

Детерминированная связка должна быть простой:
- в недели объёма (5–7) — чуть больше углеводов/калорий на восстановление,
- в недели интенсификации (9–11) — удерживать белок и достаточно углеводов под качество подходов, без резкого дефицита,
- в делоад — небольшое снижение калорий за счёт углеводов (не белка), чтобы сохранить восстановление и мышечную массу. Логика высокой роли белка для тренирующихся и его практичные рекомендации описаны в позиционных заявлениях. citeturn0search6turn0search10

## Трекинг прогресса и адаптация

### Какие метрики трекать и как часто

Минимальный «эффективный» трекинг:
- вес: 1–3 раза/нед (с усреднением),
- окружности (талия/бедро/грудь): 1 раз в 2 недели,
- силовые показатели: каждый тренировочный день (вес×повторы×подходы + RIR/RPE),
- комплаенс: факт тренировки (да/нет) + длительность.

Для нагрузки полезно хранить:
- **volume load** (сеты×повторы×вес) как базовую внешнюю нагрузку; это широко применяется как практичный показатель внешней нагрузки в силовой, хотя и имеет ограничения. citeturn5search13turn5search9  
- **session‑RPE** как внутреннюю нагрузку (RPE сессии × длительность), что описывается как валидный метод мониторинга тренировочной нагрузки в разных видах активности и легко переносится в мобильный UX. citeturn5search4turn5search12

### Модели прогрессии

**Линейная модель (простая):**
- фиксированный рост нагрузки/повторов неделю за неделей,
- обязательные делоад‑недели,
- жёсткие лимиты прибавки (2–10% только при критериях выполнения). citeturn9view1turn9view0

**Адаптивная модель (рекомендована по продукту):**
- базовый план задаёт «коридор» (диапазон повторов, целевой RIR),
- фактическая нагрузка определяется выполнением и субъективной тяжестью,
- объём/интенсивность автоматически корректируются по признакам накопленной усталости. Авторегуляция и мониторинг рассматриваются как инструменты индивидуализации. citeturn1search0turn5search5turn1search11

### Сигналы и алерты

Детерминированные алерты, которые понятны пользователю и не требуют «чёрных ящиков»:

- **Плато по силе:** e1RM/повторы на ключевом упражнении не растут 2–3 недели при хорошем комплаенсе → предложить уменьшить объём на 1 микроцикл или сделать внеплановый делоад, затем пересобрать прогрессию.  
- **Регресс:** падение e1RM/объёма >5–8% на 2 тренировках подряд + рост session‑RPE → включить «Recovery‑неделю» (делоад‑шаблон). Практики делоадинга как управляемого снижения стресса описаны в консенсусных работах/обзорах. citeturn1search9turn1search13  
- **Плато по массе при цели “cut”:** вес не меняется ≥2 недели → пересчитать TDEE, уменьшить калории (в пределах безопасного темпа), либо поднять дневную активность. Ориентиры безопасного темпа снижения массы поддерживаются источниками здравоохранения. citeturn4search9turn4search2

Опционально (advanced): интеграция смартфон‑оценки скорости штанги/повторов (VBT‑подобный функционал). Валидность/надёжность измерения скорости штанги с помощью wearable/смартфон‑технологий анализировалась в исследованиях, что делает такой модуль реалистичным в будущем, но не обязательным для MVP. citeturn5search11turn5search3

## Аналитика и выходной JSON контракт

### Графики и ключевые метрики

**Графики:**
- Вес во времени (с 7‑дневным/14‑дневным скользящим средним)
- Тренировочный объём (volume load) по неделям
- Прогресс силы по ключевым движениям (через e1RM или «лучший сет в диапазоне»)
- Внутренняя нагрузка (session‑RPE) по неделям citeturn5search4turn5search13

**Ключевые метрики недели:**
- «Weekly intensity»: средний RIR/RPE по главным упражнениям + доля подходов близко к отказу (для новичков должна быть низкой)
- «Workload»: volume load и session‑RPE
- «Adherence»: % выполненных тренировок и % выполненных подходов/упражнений

UX‑принцип: пользователю показывать **2–3 инсайта**, а не «портянку»: (1) что улучшилось, (2) что тормозит, (3) что делать на следующей неделе.

### Структурированный JSON-вывод

Ниже — единый объект, который покрывает вашу спецификацию: минимальные поля, классификация телосложения, детерминированный движок тренировок, питание (3 уровня), трекинг и аналитика. (Это дизайн‑контракт; конкретные численные коэффициенты/шаблоны можно хранить как конфиги и версионировать.)

```json
{
  "inputModel": {
    "version": "v1",
    "principles": {
      "ux": [
        "Обязательные поля только те, что меняют программу/питание.",
        "Всё, что можно уточнить после старта — делаем опциональным и дозапрашиваемым.",
        "Неделя 1 может служить калибровкой нагрузок (через RIR/RPE) без 1RM тестов."
      ],
      "safety": [
        "Встроенный предскрининг (PAR-Q+ стиль), при красных флагах — ограничение интенсивности и рекомендация консультации специалиста.",
        "Ограничение темпа прогрессии нагрузки и встроенные делоад-недели."
      ]
    },
    "fields": {
      "physicalProfile": [
        {
          "name": "ageYears",
          "type": "number",
          "required": true,
          "whyItMatters": "Возраст влияет на восстановление, допустимый тренировочный стресс, расчёты энергозатрат и предосторожности.",
          "impactOnProgram": "Корректирует стартовый объём/интенсивность, скорость прогрессии, подсказки по восстановлению."
        },
        {
          "name": "sex",
          "type": "enum(male,female)",
          "required": true,
          "whyItMatters": "Используется в расчётах REE/TDEE и для более точных рекомендаций по питанию.",
          "impactOnProgram": "Влияет на калорийность/макросы, а также на некоторые предохранители по прогрессии (консервативнее старт при низкой подготовке)."
        },
        {
          "name": "heightCm",
          "type": "number",
          "required": true,
          "whyItMatters": "Нужен для расчёта REE/TDEE и некоторых прокси телосложения.",
          "impactOnProgram": "Питание (калории), визуализация аватара (scale)."
        },
        {
          "name": "weightKg",
          "type": "number",
          "required": true,
          "whyItMatters": "Нужен для REE/TDEE, дозирования белка (г/кг), расчёта относительной силы и трекинга прогресса.",
          "impactOnProgram": "Питание; целевые темпы изменения массы; некоторые правила прогрессии; графики."
        },
        {
          "name": "waistCm",
          "type": "number",
          "required": false,
          "whyItMatters": "Простой прокси состава/распределения массы и полезная метрика прогресса.",
          "impactOnProgram": "Уточняет телосложение/аватар, может влиять на рекомендации по питанию и кардио-активности."
        }
      ],
      "trainingExperience": [
        {
          "name": "experienceLevel",
          "type": "enum(none,novice,intermediate)",
          "required": true,
          "whyItMatters": "Определяет частоту/сплит, стартовый объём, допустимые диапазоны нагрузки и скорость прогрессии.",
          "impactOnProgram": "Выбор сплита (full/upper-lower), объём подходов, правила прибавок и делоадов."
        },
        {
          "name": "currentTrainingDaysPerWeek",
          "type": "number",
          "required": true,
          "whyItMatters": "Показывает реальную адаптацию к нагрузке и помогает выбрать безопасный старт.",
          "impactOnProgram": "Если пользователь тренируется реже, алгоритм не предложит резко больший объём."
        },
        {
          "name": "technicalConfidence",
          "type": "enum(low,medium,high)",
          "required": false,
          "whyItMatters": "Техника критична для безопасности и выбора упражнений (барбелл vs машинки vs гантели).",
          "impactOnProgram": "Выбор вариантов упражнений и более консервативные RIR-цели при low."
        },
        {
          "name": "baselineStrengthOptional",
          "type": "object",
          "required": false,
          "whyItMatters": "Ускоряет персонализацию стартовых весов без калибровочной недели.",
          "impactOnProgram": "Если заполнено — движок может задать % от e1RM; если нет — старт идёт через RIR-калибровку."
        }
      ],
      "goalDefinition": [
        {
          "name": "primaryTrainingGoal",
          "type": "enum(strength,hypertrophy,fitness,endurance_mixed,sport_prep)",
          "required": true,
          "whyItMatters": "Определяет реп-диапазоны, долю аксессуаров, наличие/объём кондишна.",
          "impactOnProgram": "Задаёт фокус фаз (объём vs интенсивность) и тип прогрессии."
        },
        {
          "name": "bodyweightGoal",
          "type": "enum(cut,maintain,bulk)",
          "required": true,
          "whyItMatters": "Питание должно быть синхронизировано с тренировочным стрессом и восстановлением.",
          "impactOnProgram": "Калории/макросы + ограничение темпа прогрессии на cut."
        },
        {
          "name": "weeklyTrainingDaysTarget",
          "type": "number",
          "required": true,
          "whyItMatters": "Главный параметр, определяющий сплит и недельный объём.",
          "impactOnProgram": "Выбор full body / upper-lower / PPL и суммарный недельный объём."
        },
        {
          "name": "sessionDurationMinutes",
          "type": "enum(30,45,60,75,90)",
          "required": true,
          "whyItMatters": "Ограничивает количество упражнений и подходов.",
          "impactOnProgram": "Алгоритм урезает аксессуары и выбирает более эффективные базовые движения."
        }
      ],
      "constraintsAndLimitations": [
        {
          "name": "equipmentAccess",
          "type": "enum(bodyweight,home_dumbbells,gym,advanced_gym)",
          "required": true,
          "whyItMatters": "Определяет доступную библиотеку упражнений.",
          "impactOnProgram": "Подбор упражнений и цепочки прогрессии (варианты)."
        },
        {
          "name": "injuryPainFlags",
          "type": "array(enum(shoulder,knee,hip,lower_back,neck,wrist,ankle,none))",
          "required": true,
          "whyItMatters": "Фильтрация потенциально опасных движений и объёмов.",
          "impactOnProgram": "Исключение/замена упражнений, ограничение интенсивности, больше техники/реабилитационных аксессуаров."
        },
        {
          "name": "preScreeningRedFlags",
          "type": "boolean",
          "required": true,
          "whyItMatters": "Безопасность: при красных флагах нужны ограничения и рекомендации консультации.",
          "impactOnProgram": "Переключение в режим низкой/умеренной интенсивности и консервативный старт."
        }
      ],
      "lifestyleFactors": [
        {
          "name": "sleepHoursAvg",
          "type": "number",
          "required": true,
          "whyItMatters": "Сон — ключевой фактор восстановления.",
          "impactOnProgram": "Корректирует объём и частоту делоадов, а также алерты перегруза."
        },
        {
          "name": "stressLevel",
          "type": "enum(low,medium,high)",
          "required": true,
          "whyItMatters": "Высокий стресс снижает способность восстанавливаться.",
          "impactOnProgram": "Снижает стартовый тренировочный стресс и ускоряет включение разгрузок."
        },
        {
          "name": "dailyActivityLevel",
          "type": "enum(sedentary,moderate,active)",
          "required": true,
          "whyItMatters": "Нужен для TDEE и восстановления.",
          "impactOnProgram": "Калории/коэффициент активности и ограничения по объёму."
        },
        {
          "name": "nutritionTierPreference",
          "type": "enum(budget,standard,advanced)",
          "required": true,
          "whyItMatters": "Определяет реалистичность меню и комплаенс.",
          "impactOnProgram": "Выбор шаблонов меню/продуктов и «сложность» рекомендаций."
        },
        {
          "name": "dietaryRestrictions",
          "type": "array(enum(vegetarian,vegan,halal,kosher,lactose_intolerance,gluten_free,none))",
          "required": false,
          "whyItMatters": "Без этого меню может быть непригодным.",
          "impactOnProgram": "Заменяет источники белка/жиров и корректирует рецепты."
        }
      ]
    },
    "derivedFields": {
      "bmi": "weightKg / (heightM^2)",
      "tdee": "REE(MifflinStJeor) * activityFactor",
      "startingSplit": "rule based on weeklyTrainingDaysTarget + experienceLevel"
    }
  },
  "bodyTypeSystem": {
    "version": "v1",
    "coreIdea": "Соматотип-метки используются как UX-ярлык; в ядре — численные скоринги adiposity/muscularity/linearity.",
    "inputs": {
      "minimal": ["heightCm", "weightKg", "experienceLevel", "trainingLogsRelativeStrength"],
      "improved": ["waistCm", "hipCm(optional)", "chestOrShoulderCm(optional)", "photos(optional)"]
    },
    "scoring": {
      "adiposityScore": "z(BMI) + z(waistToHeightIfAvailable)",
      "muscularityScore": "z(relativeStrengthIndex) + z(circumferenceIndexIfAvailable)",
      "linearityScore": "z(heightToMassIndex)"
    },
    "classificationRules": {
      "ectomorph": "linearityScore high AND adiposityScore low",
      "mesomorph": "muscularityScore high AND adiposityScore not high",
      "endomorph": "adiposityScore high",
      "hybrid": "otherwise; return top-2 components with confidence"
    },
    "effects": {
      "trainingIntensity": {
        "endomorphDominant": "Conservative start, prioritize technique, gradual volume ramp.",
        "ectomorphDominant": "Avoid excessive accessory volume early; ensure adequate calories/carbs.",
        "mesomorphDominant": "Standard ramp; still obey progression safeguards."
      },
      "recovery": {
        "global": "Adjust deload triggers via sleep/stress + session-RPE trends."
      },
      "nutrition": {
        "endomorphDominant": "Emphasize sustainable deficit if cut; protein floor; moderate carbs aligned to training days.",
        "ectomorphDominant": "Prefer maintenance/small surplus if bulk; sufficient carbs under training load.",
        "mesomorphDominant": "Balanced approach."
      }
    },
    "hologramAvatar": {
      "parameters": [
        "heightScale",
        "shoulderWidth",
        "chestDepth",
        "waistWidth",
        "hipWidth",
        "armGirth",
        "thighGirth",
        "muscleDefinition",
        "bodyFatLayer"
      ],
      "implementationApproaches": [
        {
          "name": "webgl3d",
          "notes": "glTF human base mesh + morph targets + hologram shader (scanlines/glow/fresnel)."
        },
        {
          "name": "cssSvg2d",
          "notes": "SVG silhouette + layered gradients + scanning animation; fastest MVP."
        },
        {
          "name": "hybrid",
          "notes": "Low-poly 3D + CSS overlay for mobile performance."
        }
      ],
      "transformationAnimation": "Interpolate morph targets week-to-week using measured deltas (weight/waist/strength proxy)."
    }
  },
  "trainingEngine": {
    "version": "v1",
    "constraints": {
      "durationWeeks": 12,
      "frequencyRange": "3-6",
      "mustInclude": ["progressiveOverload", "recoveryWeeks"]
    },
    "programStructure": {
      "phases": [
        { "name": "adaptation", "weeks": [1, 2, 3], "goal": "Technique + base volume" },
        { "name": "deload", "weeks": [4], "goal": "Reduce stress to manage fatigue" },
        { "name": "accumulation", "weeks": [5, 6, 7], "goal": "Volume emphasis (hypertrophy/fitness)" },
        { "name": "deload", "weeks": [8], "goal": "Reduce stress" },
        { "name": "intensification", "weeks": [9, 10, 11], "goal": "Intensity emphasis (strength)" },
        { "name": "deload_or_test", "weeks": [12], "goal": "Recover + reassess loads" }
      ],
      "weeklySplitsRules": {
        "3days": "Full body A/B/C",
        "4days": "Upper/Lower",
        "5days": "Upper/Lower + Full body accessories OR sport prep",
        "6days": "PPL (with recovery gating)"
      },
      "exerciseRotation": {
        "mainLifts": "Keep stable for 4-week block",
        "accessories": "Rotate every 1-2 weeks to manage monotony and joint stress"
      }
    },
    "logic": {
      "exerciseSelection": {
        "method": "Rule-based tagging + constraints filtering + coverage scoring",
        "coverage": "Each week covers squat/hinge/push/pull/core; vertical patterns if equipment allows"
      },
      "setRepPrescription": {
        "defaultNoviceIntermediate": "1-3 sets of 8-12 (goal-adjusted)",
        "hypertrophyEmphasis": "More sets but gated by recovery signals",
        "strengthEmphasis": "Lower reps/higher intensity, longer rest"
      },
      "loadPrescription": {
        "modeA": "RIR-based autoregulation (default for MVP)",
        "modeB": "Percent-based if baselineStrengthOptional provided",
        "progressionRule": "Increase load 2-10% when criteria met; otherwise hold or reduce"
      },
      "progressionAlgorithm": {
        "doubleProgression": {
          "repRange": [8, 12],
          "rule": "Add reps within range first; then add load and reset reps"
        },
        "deloadRule": {
          "volumeReduction": "30-50%",
          "intensityReduction": "optional 5-10% depending on fatigue"
        }
      }
    },
    "personalization": {
      "inputsAffectingIntensity": ["experienceLevel", "sleepHoursAvg", "stressLevel", "trainingLogsRIR"],
      "inputsAffectingVolume": ["weeklyTrainingDaysTarget", "sessionDurationMinutes", "recoverySignals"],
      "inputsAffectingExerciseChoice": ["equipmentAccess", "injuryPainFlags", "technicalConfidence"]
    },
    "outputFormat": {
      "program": {
        "weeks": [
          {
            "weekNumber": 1,
            "phase": "adaptation",
            "days": [
              {
                "dayNumber": 1,
                "splitTag": "full_body_A",
                "exercises": [
                  {
                    "exerciseId": "goblet_squat",
                    "sets": [
                      { "setNumber": 1, "targetReps": 10, "targetRIR": 3 },
                      { "setNumber": 2, "targetReps": 10, "targetRIR": 2 }
                    ],
                    "restSeconds": 120,
                    "notes": ["Focus on technique", "Stop if pain"]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  "nutritionSystem": {
    "version": "v1",
    "calorieLogic": {
      "reeFormula": "Mifflin-St Jeor",
      "tdee": "REE * activityFactor",
      "goalAdjustments": {
        "cut": { "targetRate": "0.5-1.0 kg/week max", "defaultDeficitKcalPerDay": 300 },
        "maintain": { "deltaKcalPerDay": 0 },
        "bulk": { "defaultSurplusKcalPerDay": 150 }
      },
      "weeklyRecalibration": "Adjust calories based on 14-day trend weight delta and adherence"
    },
    "macroDistribution": {
      "protein": {
        "defaultGPerKg": 1.6,
        "rangeGPerKg": [1.4, 2.2],
        "cutAdvancedRangeGPerKg": [2.3, 3.1],
        "perMealHint": "0.25 g/kg or 20-40 g per feeding"
      },
      "fat": { "percentEnergyRange": [20, 35] },
      "carbs": {
        "rule": "Remaining calories; scale with training load",
        "athleteFrameworkGPerKgRange": [3, 12]
      }
    },
    "tiers": {
      "budget": {
        "character": "Staples + minimal recipes",
        "exampleMeals": [
          {
            "dayTemplate": "training_day",
            "meals": [
              "Овсянка + молоко/йогурт + банан",
              "Рис/гречка + курица/яйца + замороженные овощи",
              "Творог + ягоды/яблоко"
            ]
          }
        ],
        "supplements": []
      },
      "standard": {
        "character": "More variety + better micronutrient coverage",
        "exampleMeals": [
          {
            "dayTemplate": "training_day",
            "meals": [
              "Омлет + хлеб/овсянка + фрукт",
              "Картофель/рис + рыба/мясо + салат",
              "Йогурт/творог + орехи"
            ]
          }
        ],
        "supplements": []
      },
      "advanced": {
        "character": "Timing + evidence-based supplementation",
        "exampleMeals": [
          {
            "dayTemplate": "heavy_training_day",
            "meals": [
              "Углеводы + белок за 1-3 часа до тренировки (по переносимости)",
              "Белок + углеводы после тренировки в пределах 1-2 часов (если удобно)",
              "Достаточный белок распределён по дню"
            ]
          }
        ],
        "supplements": [
          { "name": "creatine_monohydrate", "dose": "3-5 g/day", "notes": "Trial in training; quality control" }
        ]
      }
    },
    "linkToTraining": {
      "highVolumeWeeks": "Slightly higher carbs/energy",
      "deloadWeeks": "Slightly lower carbs; keep protein constant",
      "cutMode": "Avoid aggressive deficits during intensification; prioritize recovery"
    }
  },
  "progressTracking": {
    "version": "v1",
    "metrics": {
      "weight": { "frequency": "1-3x/week", "use": "trend + calorie recalibration" },
      "measurements": { "frequency": "1x/2 weeks", "use": "recomposition signal" },
      "strengthByExercise": { "frequency": "every workout", "use": "progression + plateau detection" },
      "trainingConsistency": { "frequency": "every workout", "use": "adherence scoring" },
      "sessionRPE": { "frequency": "every workout", "use": "internal load monitoring" }
    },
    "evaluation": {
      "linearModel": "Fixed weekly progression within safety caps",
      "adaptiveModel": "Adjust loads/sets via RIR/RPE + fatigue signals"
    },
    "alerts": {
      "plateauStrength": { "rule": "no improvement 2-3 weeks + good adherence", "action": "deload or adjust volume" },
      "regression": { "rule": "drop >5-8% on 2 sessions + high RPE", "action": "recovery week + reassess loads" },
      "weightPlateauCut": { "rule": "no 14-day trend change", "action": "adjust calories or activity" }
    }
  },
  "analytics": {
    "version": "v1",
    "graphs": [
      { "name": "weight_over_time", "x": "date", "y": "weightKg" },
      { "name": "strength_progression", "x": "week", "y": "e1RM_or_bestSet", "groupBy": "mainLift" },
      { "name": "training_volume_load", "x": "week", "y": "sum(sets*reps*load)" },
      { "name": "session_rpe_load", "x": "week", "y": "sum(sessionRPE*durationMin)" }
    ],
    "keyMetrics": [
      "weekly_adherence_percent",
      "weekly_volume_load",
      "weekly_internal_load_session_rpe",
      "avg_RIR_main_lifts"
    ],
    "uxInsights": [
      "Вы улучшили X (PR/объём/массу).",
      "Риск перегруза: Y (сон/стресс/RPE трендов).",
      "Следующая неделя: Z (делоад/прибавка/пересборка)."
    ]
  }
}
```