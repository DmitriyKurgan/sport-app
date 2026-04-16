# FitTrack — Архитектура системы

---

## Оглавление

1. [Общая архитектура](#1-общая-архитектура)
2. [Backend — модули NestJS](#2-backend--модули-nestjs)
3. [База данных — PostgreSQL](#3-база-данных--postgresql)
4. [Training Engine — ядро логики](#4-training-engine--ядро-логики)
5. [API Design](#5-api-design)
6. [Frontend — Next.js](#6-frontend--nextjs)
7. [State Management — RTK Query](#7-state-management--rtk-query)
8. [Визуализация](#8-визуализация)
9. [Производительность и масштабирование](#9-производительность-и-масштабирование)
10. [Расширяемость](#10-расширяемость)

---

## 1. Общая архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Onboarding│ │Dashboard │ │ Training │ │  Progress   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       └─────────────┴────────────┴─────────────┘         │
│                         RTK Query                         │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API (JSON)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    NestJS Backend                         │
│  ┌──────┐ ┌───────┐ ┌────────┐ ┌─────────┐ ┌────────┐  │
│  │ User │ │Profile│ │Training│ │Nutrition│ │Progress│  │
│  │Module│ │Module │ │ Module │ │ Module  │ │ Module │  │
│  └──┬───┘ └──┬────┘ └───┬────┘ └────┬────┘ └───┬────┘  │
│     └────────┴──────────┴───────────┴──────────┘        │
│                  TrainingEngine (pure)                    │
│                  AnalyticsModule                          │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         PostgreSQL     Redis        Bull Queue
         (данные)      (кэш)      (фоновые задачи)
```

### Принципы

- **Модульность**: каждый домен — отдельный NestJS-модуль
- **Чистая бизнес-логика**: TrainingEngine — pure functions без side effects
- **API-first**: бэкенд — чистый REST API, фронтенд — отдельное приложение
- **Типобезопасность**: строгие DTO с валидацией на входе и выходе

### Научные основы (sport-research.md)

Вся продуктовая логика опирается на доказательную базу:

| Принцип | Источник | Применение |
|---------|----------|------------|
| Частота для novice/intermediate | NSCA / ACSM normatives | 2–3 трен/нед novice, 3–4 intermediate |
| Прогрессия 2–10% | NSCA recommendations | Прибавка только при выполнении критериев |
| Делoad-недели | Consensus on deloading | Каждая 4-я неделя — обязательная разгрузка |
| RIR/RPE авторегуляция | Helms et al, Zourdos | Default mode без 1RM-тестов |
| Mifflin–St Jeor (REE) | Validated formula | База расчёта калорий |
| Темп снижения массы 0.5–1 кг/нед | Health authorities | Жёсткий потолок дефицита |
| Белок 1.6 г/кг (ranges 1.4–2.2) | ISSN position stand | База макрорасчёта |
| Углеводы 3–12 г/кг | Sports nutrition framework | Скейлится под объём |
| PAR-Q+ скрининг | Pre-participation guidelines | Обязательный шаг онбординга |
| Volume load + session-RPE | Foster et al | Базовые метрики мониторинга |
| Double progression | Strength training literature | Главный алгоритм прогрессии |

### Программные предохранители (safety-by-design)

Архитектурно встроенные ограничения, которые не зависят от UI:

1. **Pre-screening gate**: при `redFlags=true` — режим LOW_INTENSITY (фиксированный low-impact шаблон, рекомендация консультации врача)
2. **Лимит дефицита**: max 1 кг/нед потери, max −600 ккал/сут от TDEE
3. **Лимит прогрессии**: max +10% нагрузки за неделю на упражнение
4. **Принудительный делoad**: каждая 4-я неделя, ИЛИ если RPE > 9 три недели подряд
5. **Травм-фильтр**: упражнения с конфликтующими joints автоматически исключаются на уровне exercise-selector
6. **Beginner cap**: novice не получает > 4 трен/нед, даже если запросил больше

### Структура программы (фиксированная)

**Длительность: 12 недель = 3 мезоцикла**

```
Mesocycle 1 (адаптация):     Weeks 1, 2, 3 — техника + базовый объём
                             Week 4         — DELOAD
Mesocycle 2 (накопление):    Weeks 5, 6, 7 — объём↑ (гипертрофия / fitness)
                             Week 8         — DELOAD
Mesocycle 3 (интенсификация):Weeks 9,10,11 — интенсивность↑ (сила)
                             Week 12        — DELOAD / TEST / пересборка
```

---

## 2. Backend — модули NestJS

### 2.1 UserModule

**Ответственность**: регистрация, аутентификация, управление аккаунтом.

**Структура папок**:
```
src/modules/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── user.entity.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── login-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── refresh-token.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── refresh-token.strategy.ts
├── decorators/
│   └── current-user.decorator.ts
└── __tests__/
    ├── user.service.spec.ts
    └── user.controller.spec.ts
```

**UserService — методы**:

| Метод | Описание | Вход | Выход |
|-------|----------|------|-------|
| `register(dto)` | Регистрация нового пользователя | `CreateUserDto` | `UserResponseDto` |
| `login(dto)` | Аутентификация, выдача JWT + refresh | `LoginUserDto` | `{ accessToken, refreshToken }` |
| `refreshTokens(userId, rt)` | Обновление пары токенов | `string, string` | `{ accessToken, refreshToken }` |
| `logout(userId)` | Инвалидация refresh token | `string` | `void` |
| `findById(id)` | Получить пользователя по ID | `string` | `User` |
| `updateEmail(userId, dto)` | Обновить email | `string, UpdateUserDto` | `UserResponseDto` |
| `deleteAccount(userId)` | Soft-delete аккаунта | `string` | `void` |

**DTOs**:

```typescript
// create-user.dto.ts
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}

// login-user.dto.ts
class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// user-response.dto.ts
class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}
```

**Контроллер — эндпоинты**:

| Метод | Путь | Guard | Описание |
|-------|------|-------|----------|
| POST | `/api/v1/auth/register` | — | Регистрация |
| POST | `/api/v1/auth/login` | — | Вход |
| POST | `/api/v1/auth/refresh` | RefreshTokenGuard | Обновление токенов |
| POST | `/api/v1/auth/logout` | JwtAuthGuard | Выход |
| GET | `/api/v1/users/me` | JwtAuthGuard | Текущий пользователь |
| PATCH | `/api/v1/users/me` | JwtAuthGuard | Обновление профиля |
| DELETE | `/api/v1/users/me` | JwtAuthGuard | Удаление аккаунта |

---

### 2.2 ProfileModule

**Ответственность**: анкета пользователя, физические параметры, цели, уровень подготовки, lifestyle-факторы, диетические ограничения.

**Принцип минимизации**: обязательные поля — только те, что меняют программу или питание. Остальное — опциональное и дозапрашивается.

**Структура папок**:
```
src/modules/profile/
├── profile.module.ts
├── profile.controller.ts
├── profile.service.ts
├── profile.entity.ts
├── dto/
│   ├── create-profile.dto.ts
│   ├── update-profile.dto.ts
│   └── profile-response.dto.ts
├── enums/
│   ├── fitness-goal.enum.ts
│   ├── fitness-level.enum.ts
│   ├── gender.enum.ts
│   └── body-type.enum.ts
└── __tests__/
    ├── profile.service.spec.ts
    └── profile.controller.spec.ts
```

**ProfileService — методы**:

| Метод | Описание | Вход | Выход |
|-------|----------|------|-------|
| `create(userId, dto)` | Создание профиля (onboarding) | `string, CreateProfileDto` | `ProfileResponseDto` |
| `findByUserId(userId)` | Получить профиль | `string` | `Profile` |
| `update(userId, dto)` | Обновить профиль | `string, UpdateProfileDto` | `ProfileResponseDto` |
| `calculateBMI(profile)` | Рассчитать BMI | `Profile` | `number` |
| `calculateTDEE(profile)` | Рассчитать суточную норму калорий | `Profile` | `number` |

**Enums** (синхронизированы с sport-research.md):

```typescript
enum PrimaryTrainingGoal {
  STRENGTH = 'strength',
  HYPERTROPHY = 'hypertrophy',
  FITNESS = 'fitness',
  ENDURANCE_MIXED = 'endurance_mixed',
  SPORT_PREP = 'sport_prep',
}

enum BodyweightGoal {
  CUT = 'cut',           // дефицит, цель — снизить массу
  MAINTAIN = 'maintain', // поддержание
  BULK = 'bulk',         // профицит, цель — набрать массу
}

enum ExperienceLevel {
  NONE = 'none',                 // 0 опыта
  NOVICE = 'novice',             // 0-6 месяцев
  INTERMEDIATE = 'intermediate', // 6-24 месяца
}

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

enum SessionDuration {
  MIN_30 = 30,
  MIN_45 = 45,
  MIN_60 = 60,
  MIN_75 = 75,
  MIN_90 = 90,
}

enum EquipmentAccess {
  BODYWEIGHT = 'bodyweight',          // только своё тело
  HOME_DUMBBELLS = 'home_dumbbells',  // дома гантели/резинки
  GYM = 'gym',                        // обычный тренажёрный зал
  ADVANCED_GYM = 'advanced_gym',      // зал + специализированное оборудование
}

enum InjuryFlag {
  SHOULDER = 'shoulder',
  KNEE = 'knee',
  HIP = 'hip',
  LOWER_BACK = 'lower_back',
  NECK = 'neck',
  WRIST = 'wrist',
  ANKLE = 'ankle',
  NONE = 'none',
}

enum TechnicalConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

enum StressLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

enum DailyActivityLevel {
  SEDENTARY = 'sedentary',  // офисная работа, без активности
  MODERATE = 'moderate',    // ходьба, лёгкая активность
  ACTIVE = 'active',        // физическая работа / много движения
}

enum NutritionTier {
  BUDGET = 'budget',     // минимум денег, простые продукты
  STANDARD = 'standard', // разнообразие
  ADVANCED = 'advanced', // тайминг + добавки
}

enum DietaryRestriction {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  HALAL = 'halal',
  KOSHER = 'kosher',
  LACTOSE_INTOLERANCE = 'lactose_intolerance',
  GLUTEN_FREE = 'gluten_free',
  NONE = 'none',
}
```

**DTOs**:

```typescript
// create-profile.dto.ts
class CreateProfileDto {
  // === physicalProfile ===
  @IsEnum(Gender)
  sex: Gender;

  @IsInt() @Min(14) @Max(80)
  ageYears: number;

  @IsNumber() @Min(100) @Max(230)
  heightCm: number;

  @IsNumber() @Min(30) @Max(250)
  weightKg: number;

  @IsOptional() @IsNumber() @Min(40) @Max(200)
  waistCm?: number;

  // === trainingExperience ===
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @IsInt() @Min(0) @Max(7)
  currentTrainingDaysPerWeek: number;

  @IsOptional() @IsEnum(TechnicalConfidence)
  technicalConfidence?: TechnicalConfidence;

  @IsOptional() @ValidateNested()
  @Type(() => BaselineStrengthDto)
  baselineStrengthOptional?: BaselineStrengthDto; // squat/bench/deadlift max если знает

  // === goalDefinition ===
  @IsEnum(PrimaryTrainingGoal)
  primaryTrainingGoal: PrimaryTrainingGoal;

  @IsEnum(BodyweightGoal)
  bodyweightGoal: BodyweightGoal;

  @IsInt() @Min(2) @Max(6)
  weeklyTrainingDaysTarget: number;

  @IsEnum(SessionDuration)
  sessionDurationMinutes: SessionDuration;

  // === constraintsAndLimitations ===
  @IsEnum(EquipmentAccess)
  equipmentAccess: EquipmentAccess;

  @IsArray() @IsEnum(InjuryFlag, { each: true })
  injuryPainFlags: InjuryFlag[];

  @IsBoolean()
  preScreeningRedFlags: boolean; // результат PAR-Q+ из PreScreeningModule

  // === lifestyleFactors ===
  @IsNumber() @Min(3) @Max(12)
  sleepHoursAvg: number;

  @IsEnum(StressLevel)
  stressLevel: StressLevel;

  @IsEnum(DailyActivityLevel)
  dailyActivityLevel: DailyActivityLevel;

  @IsEnum(NutritionTier)
  nutritionTierPreference: NutritionTier;

  @IsOptional() @IsArray() @IsEnum(DietaryRestriction, { each: true })
  dietaryRestrictions?: DietaryRestriction[];
}

// baseline-strength.dto.ts
class BaselineStrengthDto {
  @IsOptional() @IsNumber() squatKg?: number;
  @IsOptional() @IsNumber() benchKg?: number;
  @IsOptional() @IsNumber() deadliftKg?: number;
  @IsOptional() @IsNumber() pullUpsMaxReps?: number;
}
```

**Производные поля (derivedFields)** — рассчитываются при создании/обновлении:

| Поле | Формула | Использование |
|------|---------|---------------|
| `bmi` | `weight / (heightM)^2` | отображение, body scoring |
| `ree` | Mifflin–St Jeor | база TDEE |
| `tdee` | `REE * activityFactor` | калории |
| `activityFactor` | мэппинг ниже | TDEE |
| `startingSplit` | rule(daysTarget, level) | TrainingEngine |
| `proteinTargetG` | `weightKg * 1.6` (range 1.4–2.2, cut+advanced 2.3–3.1) | NutritionModule |

**Activity factor** (по `dailyActivityLevel` + `weeklyTrainingDaysTarget`):
- sedentary + 2-3 трен/нед → 1.375
- sedentary + 4+ трен/нед → 1.55
- moderate + 2-3 → 1.55
- moderate + 4+ → 1.725
- active + 2-3 → 1.725
- active + 4+ → 1.9

**Контроллер**:

| Метод | Путь | Guard | Описание |
|-------|------|-------|----------|
| POST | `/api/v1/profile` | JwtAuthGuard | Создать профиль |
| GET | `/api/v1/profile` | JwtAuthGuard | Получить профиль |
| PATCH | `/api/v1/profile` | JwtAuthGuard | Обновить профиль |

---

### 2.3 TrainingModule

**Ответственность**: тренировочные программы, недели, дни, упражнения, связь с TrainingEngine.

**Структура папок**:
```
src/modules/training/
├── training.module.ts
├── controllers/
│   ├── training-program.controller.ts
│   ├── training-day.controller.ts
│   └── exercise.controller.ts
├── services/
│   ├── training-program.service.ts
│   ├── training-day.service.ts
│   └── exercise.service.ts
├── entities/
│   ├── training-program.entity.ts
│   ├── training-week.entity.ts
│   ├── training-day.entity.ts
│   ├── exercise.entity.ts
│   └── exercise-set.entity.ts
├── dto/
│   ├── generate-program.dto.ts
│   ├── program-response.dto.ts
│   ├── day-response.dto.ts
│   ├── exercise-response.dto.ts
│   └── complete-exercise.dto.ts
├── enums/
│   ├── muscle-group.enum.ts
│   ├── exercise-type.enum.ts
│   ├── program-status.enum.ts
│   └── difficulty.enum.ts
└── __tests__/
    ├── training-program.service.spec.ts
    └── training-day.service.spec.ts
```

**TrainingProgramService — методы**:

| Метод | Описание |
|-------|----------|
| `generate(userId)` | Вызывает TrainingEngine, сохраняет сгенерированную программу |
| `findActive(userId)` | Текущая активная программа пользователя |
| `findAll(userId)` | Все программы пользователя (история) |
| `findById(id, userId)` | Конкретная программа |
| `deactivate(id, userId)` | Деактивировать программу |
| `regenerate(userId)` | Пересоздать программу (после изменения профиля) |

**TrainingDayService — методы**:

| Метод | Описание |
|-------|----------|
| `findByProgramAndWeek(programId, weekNumber)` | Тренировки на неделю |
| `findById(dayId)` | Конкретная тренировка |
| `startDay(dayId, userId)` | Начать тренировку (timestamp) |
| `completeDay(dayId, userId)` | Завершить тренировку |

**ExerciseService — методы**:

| Метод | Описание |
|-------|----------|
| `findByDay(dayId)` | Все упражнения дня |
| `completeExercise(exerciseId, dto)` | Записать выполнение (вес, повторения) |
| `getExerciseCatalog(filters)` | Каталог доступных упражнений |

**Enums**:

```typescript
// Главная классификация упражнений — по движению, не по мышце
enum MovementPattern {
  SQUAT = 'squat',                  // приседания
  HINGE = 'hinge',                  // наклоны (deadlift, RDL, hip thrust)
  HORIZONTAL_PUSH = 'horizontal_push', // жимы лёжа
  HORIZONTAL_PULL = 'horizontal_pull', // тяги в наклоне
  VERTICAL_PUSH = 'vertical_push',     // жимы стоя
  VERTICAL_PULL = 'vertical_pull',     // подтягивания, верхняя тяга
  CARRY = 'carry',                  // фермер
  CORE = 'core',                    // пресс/стабилизаторы
  LUNGE = 'lunge',                  // выпады/сплит-сквоты
  ISOLATION = 'isolation',          // одиночные суставы (бицепс, трицепс и т.д.)
}

enum MuscleGroup {
  CHEST = 'chest', BACK = 'back', SHOULDERS = 'shoulders',
  BICEPS = 'biceps', TRICEPS = 'triceps', FOREARMS = 'forearms',
  QUADRICEPS = 'quadriceps', HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes', CALVES = 'calves', ABS = 'abs',
  TRAPS = 'traps', LATS = 'lats',
}

enum JointInvolvement {
  KNEE = 'knee', HIP = 'hip', SHOULDER = 'shoulder',
  SPINE = 'spine', WRIST = 'wrist', ANKLE = 'ankle',
}

enum ExerciseRole {
  MAIN_LIFT = 'main_lift',     // основное движение мезоцикла, фиксируется на 4 нед
  ACCESSORY = 'accessory',     // ротируется каждые 1-2 нед
  FINISHER = 'finisher',       // в конце тренировки
  WARMUP = 'warmup',
}

enum ProgramPhase {
  ADAPTATION = 'adaptation',           // weeks 1-3
  ACCUMULATION = 'accumulation',       // weeks 5-7
  INTENSIFICATION = 'intensification', // weeks 9-11
  DELOAD = 'deload',                   // weeks 4, 8, 12
}

enum ProgramStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

enum Difficulty {
  LEVEL_1 = 1, LEVEL_2 = 2, LEVEL_3 = 3, LEVEL_4 = 4, LEVEL_5 = 5,
}
```

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/training/generate` | Сгенерировать программу |
| GET | `/api/v1/training/programs` | Все программы |
| GET | `/api/v1/training/programs/active` | Активная программа |
| GET | `/api/v1/training/programs/:id` | Конкретная программа |
| GET | `/api/v1/training/programs/:id/weeks/:weekNum` | Неделя программы |
| GET | `/api/v1/training/days/:id` | Конкретный день |
| POST | `/api/v1/training/days/:id/start` | Начать тренировку |
| POST | `/api/v1/training/days/:id/complete` | Завершить тренировку |
| POST | `/api/v1/training/exercises/:id/complete` | Записать подход |
| GET | `/api/v1/training/catalog` | Каталог упражнений |

---

### 2.4 NutritionModule

**Ответственность**: планы питания, рекомендации по макронутриентам.

**Структура папок**:
```
src/modules/nutrition/
├── nutrition.module.ts
├── nutrition.controller.ts
├── nutrition.service.ts
├── entities/
│   ├── nutrition-plan.entity.ts
│   └── meal.entity.ts
├── dto/
│   ├── create-nutrition-plan.dto.ts
│   ├── nutrition-plan-response.dto.ts
│   └── meal-response.dto.ts
├── enums/
│   └── meal-type.enum.ts
└── __tests__/
    └── nutrition.service.spec.ts
```

**NutritionService — методы**:

| Метод | Описание |
|-------|----------|
| `generatePlan(userId)` | Генерация плана на основе профиля и цели |
| `findActivePlan(userId)` | Текущий план питания |
| `updatePlan(planId, dto)` | Обновить план |
| `calculateMacros(profile)` | Рассчитать БЖУ (чистая функция) |
| `getMealsByDay(planId, date)` | Приемы пищи на день |

**Расчёт калорий — поэтапно** (sport-research.md → nutritionSystem):

```
1. REE по Mifflin–St Jeor:
   мужчины: REE = 10*weight + 6.25*height - 5*age + 5
   женщины: REE = 10*weight + 6.25*height - 5*age - 161

2. TDEE = REE * activityFactor (см. ProfileModule, маппинг)

3. Корректировка по bodyweightGoal:
   cut:      TDEE - 300 ккал (default), max потеря 1 кг/нед, max −600 ккал
   maintain: TDEE
   bulk:     TDEE + 150 ккал (default, малый профицит)

4. Корректировка по фазе тренировок:
   accumulation (объёмные нед 5-7):    +5–10% углеводов
   intensification (нед 9-11):          держать белок, достаточно углеводов
   deload (нед 4, 8, 12):               -5–10% калорий за счёт углеводов
                                        (НЕ за счёт белка — для сохранения LBM)
```

**Расчёт макросов**:

| Макрос | Default | Range | Особые случаи |
|--------|---------|-------|---------------|
| Белок | `1.6 г/кг * weight` | 1.4–2.2 г/кг | Cut + advanced: 2.3–3.1 г/кг |
| Жиры | 25% энергии | 20–35% | — |
| Углеводы | остаток | 3–12 г/кг (athlete framework) | Скейлится под объём |

**На приём пищи** (распределение белка): 0.25 г/кг или 20–40 г.

**Три тира питания** (`NutritionTier`):

| Тир | Характер | Примеры | Добавки |
|-----|----------|---------|---------|
| **budget** | Минимум денег, простые продукты | Овсянка+молоко+банан / Рис+курица+замор. овощи / Творог+ягоды | — |
| **standard** | Разнообразие, micronutrients | Омлет+хлеб+фрукт / Картофель+рыба+салат / Йогурт+орехи | — |
| **advanced** | Карб-тайминг + добавки | Углеводы+белок за 1–3ч до / Белок+углеводы 1–2ч после | креатин 3–5 г/сут (доказательная база) |

**Шаблоны меню** (`meal_templates` таблица):
- `dayTemplate`: `training_day` / `rest_day` / `heavy_training_day`
- 3–5 приёмов пищи, заранее посчитанные БЖУ и калории
- Подбор шаблонов по `tier` + `dietaryRestrictions`

**NutritionService — методы**:

| Метод | Описание |
|-------|----------|
| `generatePlan(userId, programWeek)` | Расчёт по профилю + текущей фазе программы |
| `recalibrate(userId)` | Пересчёт по 14-дневному тренду веса (см. AlertsModule) |
| `findActivePlan(userId)` | Текущий план |
| `calculateMacros(profile, goal, phase)` | Чистая функция расчёта |
| `selectMealTemplates(tier, restrictions, calories, protein)` | Подбор меню |
| `getMealsByDay(planId, dayType)` | Приёмы пищи на тип дня |

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/nutrition/generate` | Сгенерировать план |
| GET | `/api/v1/nutrition/plan` | Текущий план |
| PATCH | `/api/v1/nutrition/plan/:id` | Обновить план |
| GET | `/api/v1/nutrition/plan/:id/meals` | Приемы пищи |

---

### 2.5 ProgressModule

**Ответственность**: логирование прогресса тренировок, замеры тела, фото.

**Структура папок**:
```
src/modules/progress/
├── progress.module.ts
├── controllers/
│   ├── progress-log.controller.ts
│   └── body-measurement.controller.ts
├── services/
│   ├── progress-log.service.ts
│   └── body-measurement.service.ts
├── entities/
│   ├── progress-log.entity.ts
│   ├── body-measurement.entity.ts
│   └── user-exercise-progress.entity.ts
├── dto/
│   ├── create-progress-log.dto.ts
│   ├── create-body-measurement.dto.ts
│   ├── progress-log-response.dto.ts
│   └── body-measurement-response.dto.ts
└── __tests__/
    ├── progress-log.service.spec.ts
    └── body-measurement.service.spec.ts
```

**ProgressLogService — методы**:

| Метод | Описание |
|-------|----------|
| `logSet(userId, dto)` | Запись подхода (вес, повторы, RIR/RPE — см. ниже) |
| `logSessionRPE(userId, dto)` | session-RPE: общая тяжесть всей тренировки (1-10) + длительность |
| `getByDateRange(userId, from, to)` | Логи за период |
| `getByExercise(userId, exerciseId)` | История упражнения |
| `getPersonalRecords(userId)` | PR (max weight для целевого reps) + estimated 1RM |
| `getVolumeLoadByWeek(userId)` | Volume load = Σ(sets × reps × weight) по неделям |
| `getInternalLoadByWeek(userId)` | Internal load = Σ(session-RPE × duration) по неделям |
| `getAvgRIRMainLifts(userId, week)` | Средний RIR по main_lift упражнениям недели |

**RIR vs RPE**:
- **RIR** (Reps in Reserve, 0–5) — основной метод авторегуляции для MVP: «сколько повторений в запасе осталось»
- **RPE** (Rate of Perceived Exertion, 1–10) — алтернативная шкала, сессионный показатель
- Маппинг: RIR=0 ≈ RPE 10; RIR=1 ≈ RPE 9; RIR=2 ≈ RPE 8; RIR=3 ≈ RPE 7
- Пользователь вводит **либо RIR, либо RPE** (по UI-настройке)

**Estimated 1RM (e1RM)** — формула Эпли:
```
e1RM = weight * (1 + reps / 30)
```
Используется для трекинга силы без тестирования max.

**BodyMeasurementService — методы**:

| Метод | Описание |
|-------|----------|
| `create(userId, dto)` | Новый замер |
| `findAll(userId)` | Все замеры |
| `findLatest(userId)` | Последний замер |
| `getHistory(userId, metric)` | История конкретного показателя |

**DTOs**:

```typescript
// create-progress-log.dto.ts
class CreateProgressLogDto {
  @IsUUID()
  exerciseId: string;

  @IsUUID()
  trainingDayId: string;

  @IsUUID()
  dayExerciseId: string; // привязка к плановому подходу (для прогрессии)

  @IsInt() @Min(1) @Max(10)
  setNumber: number;

  @IsNumber() @Min(0) @Max(500)
  weightKg: number;

  @IsInt() @Min(0) @Max(100)
  reps: number;

  @IsOptional() @IsInt() @Min(0) @Max(5)
  rir?: number; // Reps In Reserve — приоритетный

  @IsOptional() @IsNumber() @Min(1) @Max(10)
  rpe?: number; // альтернативная шкала

  @IsBoolean()
  isWarmup: boolean;

  @IsOptional() @IsString()
  notes?: string;
}

// log-session-rpe.dto.ts
class LogSessionRPEDto {
  @IsUUID()
  trainingDayId: string;

  @IsNumber() @Min(1) @Max(10)
  sessionRPE: number; // общая субъективная тяжесть тренировки

  @IsInt() @Min(5) @Max(240)
  durationMinutes: number;
}

// create-body-measurement.dto.ts
class CreateBodyMeasurementDto {
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg: number;

  @IsOptional()
  @IsNumber()
  bodyFatPercent?: number;

  @IsOptional()
  @IsNumber()
  chestCm?: number;

  @IsOptional()
  @IsNumber()
  waistCm?: number;

  @IsOptional()
  @IsNumber()
  hipsCm?: number;

  @IsOptional()
  @IsNumber()
  bicepsCm?: number;

  @IsOptional()
  @IsNumber()
  thighCm?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
```

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/progress/log` | Записать подход |
| GET | `/api/v1/progress/logs` | Логи (фильтры: дата, упражнение) |
| GET | `/api/v1/progress/records` | Персональные рекорды |
| POST | `/api/v1/progress/measurements` | Новый замер тела |
| GET | `/api/v1/progress/measurements` | Все замеры |
| GET | `/api/v1/progress/measurements/latest` | Последний замер |

---

### 2.6 AnalyticsModule

**Ответственность**: агрегация данных, расчет статистики, подготовка данных для графиков.

**Структура папок**:
```
src/modules/analytics/
├── analytics.module.ts
├── analytics.controller.ts
├── analytics.service.ts
├── dto/
│   ├── analytics-query.dto.ts
│   ├── dashboard-response.dto.ts
│   ├── exercise-analytics-response.dto.ts
│   └── body-analytics-response.dto.ts
├── interfaces/
│   ├── chart-data-point.interface.ts
│   └── analytics-period.interface.ts
└── __tests__/
    └── analytics.service.spec.ts
```

**AnalyticsService — методы**:

| Метод | Описание |
|-------|----------|
| `getDashboard(userId)` | Сводка для дашборда: текущая программа, прогресс недели, тренды |
| `getExerciseProgress(userId, exerciseId, period)` | Прогресс по упражнению (график) |
| `getVolumeAnalytics(userId, period)` | Общий объем тренировок (тоннаж) |
| `getBodyComposition(userId, period)` | Динамика замеров тела |
| `getStrengthScore(userId)` | Оценка силы (относительно веса тела) |
| `getConsistencyScore(userId)` | Оценка регулярности (% выполненных тренировок) |
| `getWeeklyReport(userId)` | Еженедельный отчет |

**Интерфейсы для графиков**:

```typescript
interface ChartDataPoint {
  date: string;       // ISO date
  value: number;
  label?: string;
}

interface AnalyticsPeriod {
  from: Date;
  to: Date;
  granularity: 'day' | 'week' | 'month';
}

interface DashboardResponse {
  currentProgram: {
    name: string;
    weekNumber: number;
    totalWeeks: number;
    completedDays: number;
    totalDays: number;
  };
  weekProgress: {
    planned: number;
    completed: number;
    upcoming: TrainingDaySummary[];
  };
  recentRecords: PersonalRecord[];
  bodyWeight: ChartDataPoint[];     // последние 30 дней
  totalVolume: ChartDataPoint[];    // последние 4 недели
  consistencyScore: number;         // 0-100
}
```

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/analytics/dashboard` | Сводка дашборда |
| GET | `/api/v1/analytics/exercise/:id` | Прогресс по упражнению (e1RM, best-set) |
| GET | `/api/v1/analytics/volume` | Volume load по неделям |
| GET | `/api/v1/analytics/internal-load` | Session-RPE * duration по неделям |
| GET | `/api/v1/analytics/body` | Динамика тела (вес 7/14-дневный rolling avg) |
| GET | `/api/v1/analytics/report/weekly` | Недельный отчёт + 2-3 UX-инсайта |

**Weekly UX insights** — 3 фразы пользователю (не «портянка»):
1. Что улучшилось (PR, объём, масса)
2. Что тормозит (перегруз, плохой сон, плато)
3. Что делать на следующей неделе (делoad / прибавка / пересборка)

---

### 2.7 PreScreeningModule

**Ответственность**: PAR-Q+ опросник перед стартом, выявление red flags, переключение в режим безопасности.

**Структура папок**:
```
src/modules/pre-screening/
├── pre-screening.module.ts
├── pre-screening.controller.ts
├── pre-screening.service.ts
├── pre-screening.entity.ts
├── dto/
│   ├── submit-screening.dto.ts
│   └── screening-result.dto.ts
├── constants/
│   └── parq-questions.ts          — каноничный набор вопросов PAR-Q+
└── __tests__/
```

**PreScreeningService — методы**:

| Метод | Описание |
|-------|----------|
| `submit(userId, answers)` | Сохранить ответы, рассчитать redFlags |
| `findLatest(userId)` | Последний скрининг |
| `evaluateRedFlags(answers)` | Pure function: ответы → redFlags + список причин |

**PAR-Q+ вопросы (каноничные)**:

```typescript
const PARQ_QUESTIONS = [
  {
    id: 'heart_condition',
    text: 'Говорил ли вам врач, что у вас проблема с сердцем, и что вы должны заниматься физической активностью только под присмотром врача?',
    redFlagIfYes: true,
  },
  { id: 'chest_pain_activity', text: 'Чувствуете ли вы боль в груди при физической активности?', redFlagIfYes: true },
  { id: 'chest_pain_rest', text: 'Чувствовали ли вы боль в груди в последний месяц в покое?', redFlagIfYes: true },
  { id: 'balance_dizzy', text: 'Теряли ли вы равновесие из-за головокружения или сознание?', redFlagIfYes: true },
  { id: 'bone_joint', text: 'Есть ли у вас проблемы с костями или суставами, которые могут ухудшиться при физической активности?', redFlagIfYes: true },
  { id: 'medication_bp_heart', text: 'Принимаете ли вы лекарства для давления или сердца?', redFlagIfYes: true },
  { id: 'other_reason', text: 'Знаете ли вы какую-то причину, по которой вам нельзя заниматься физической активностью?', redFlagIfYes: true },
  { id: 'pregnant', text: 'Беременны ли вы?', redFlagIfYes: false, requiresClarification: true },
];
```

**Логика**:
- Если **хотя бы один redFlag = YES** → `redFlags: true`
- При redFlags: профиль создаётся с пометкой → TrainingEngine генерирует **режим LOW_INTENSITY** (только bodyweight, низкоинтенсивные упражнения, max 3 трен/нед, RIR ≥ 3, рекомендация консультации)
- Пользователь видит баннер: «Перед началом — проконсультируйтесь со специалистом»

**Контроллер**:

| Метод | Путь | Guard | Описание |
|-------|------|-------|----------|
| POST | `/api/v1/screening` | JwtAuthGuard | Отправить ответы PAR-Q+ |
| GET | `/api/v1/screening/latest` | JwtAuthGuard | Последний скрининг |
| GET | `/api/v1/screening/questions` | — | Список вопросов |

---

### 2.8 BodyTypeModule

**Ответственность**: numeric scoring телосложения (adiposity/muscularity/linearity), классификация в эктоморф/мезоморф/эндоморф/гибрид.

**Принцип**: ярлык — UX-слой; в ядре — numeric scores, которые влияют на параметры.

**Структура папок**:
```
src/modules/body-type/
├── body-type.module.ts
├── body-type.controller.ts
├── body-type.service.ts
├── body-type.entity.ts            — снапшоты scoring во времени
├── interfaces/
│   ├── body-scores.interface.ts
│   └── body-classification.interface.ts
├── calculators/
│   ├── adiposity-score.ts
│   ├── muscularity-score.ts
│   ├── linearity-score.ts
│   └── classifier.ts
└── __tests__/
```

**Scoring (z-scores)**:

| Score | Формула (минимум) | + если есть данные |
|-------|------|---------------------|
| `adiposityScore` | `z(BMI)` | `+ z(waistToHeightRatio)` |
| `muscularityScore` | `z(relativeStrengthIndex)` (e1RM main_lifts / weight) | `+ z(circumferenceIndex)` |
| `linearityScore` | `z(heightToMassIndex)` = `height / weight^(1/3)` | — |

**Классификация**:
```typescript
function classify(scores: BodyScores): BodyClassification {
  const HIGH = 0.5;   // z-score threshold
  const LOW = -0.5;

  if (scores.linearity > HIGH && scores.adiposity < LOW)
    return { type: 'ectomorph', confidence: 'high' };

  if (scores.muscularity > HIGH && scores.adiposity < HIGH)
    return { type: 'mesomorph', confidence: 'high' };

  if (scores.adiposity > HIGH)
    return { type: 'endomorph', confidence: 'high' };

  // гибрид: вернуть top-2 компонента с confidence
  return { type: 'hybrid', dominantComponents: top2(scores), confidence: 'medium' };
}
```

**Влияние на программу/питание**:

| Доминирование | Тренинг | Питание |
|---------------|---------|---------|
| **endomorph** | Консервативный старт, упор на технику, постепенный рост объёма | Устойчивый дефицит на cut, высокий floor белка, умеренные углеводы под трен. дни |
| **ectomorph** | Не «в потолок» аксессуарами в начале | Maintain/малый профицит на bulk, достаточно углеводов под нагрузку |
| **mesomorph** | Стандартный ramp + предохранители прогрессии | Сбалансированный подход |

**BodyTypeService — методы**:

| Метод | Описание |
|-------|----------|
| `recalculate(userId)` | Пересчёт scoring (вызывается при обновлении профиля/замеров) |
| `getCurrent(userId)` | Текущий снапшот scoring + классификация |
| `getHistory(userId)` | История scoring (для трендов) |

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/body-type` | Текущий тип + scores |
| GET | `/api/v1/body-type/history` | История |
| POST | `/api/v1/body-type/recalculate` | Принудительный пересчёт |

---

### 2.9 AvatarModule

**Ответственность**: параметры голограф-аватара, морф-таргеты, история трансформации.

**Структура папок**:
```
src/modules/avatar/
├── avatar.module.ts
├── avatar.controller.ts
├── avatar.service.ts
├── avatar.entity.ts                 — снапшоты параметров во времени
└── interfaces/
    └── avatar-params.interface.ts
```

**Параметры аватара** (передаются на фронт для рендера):

```typescript
interface AvatarParams {
  heightScale: number;        // относительный scale (1.0 = 175cm)
  shoulderWidth: number;      // 0.7-1.3
  chestDepth: number;
  waistWidth: number;
  hipWidth: number;
  armGirth: number;
  thighGirth: number;
  muscleDefinition: number;   // 0-1 (от bodyfat scoring)
  bodyFatLayer: number;       // 0-1 (визуальный слой жира)
}
```

**Маппинг профиль → параметры**:

| Параметр | Из чего считается |
|----------|-------------------|
| `heightScale` | `heightCm / 175` |
| `shoulderWidth` | `chestCm` (если есть) или константа по полу |
| `waistWidth` | `waistCm` (или вывод из BMI + adiposity) |
| `hipWidth` | `hipsCm` (если есть) |
| `armGirth` | `bicepsCm` (если есть) |
| `muscleDefinition` | `1 - adiposityScore` (нормализован к 0-1) |
| `bodyFatLayer` | `adiposityScore` (нормализован) |

**AvatarService — методы**:

| Метод | Описание |
|-------|----------|
| `getCurrent(userId)` | Текущие параметры аватара |
| `recalculate(userId)` | Пересчёт после обновления замеров |
| `getTransformation(userId, fromDate, toDate)` | Дельты для анимации трансформации |

**Подход реализации (фронт)**: WebGL (Three.js) + glTF base mesh + morph targets + hologram shader (scanlines/glow/fresnel). Альтернатива MVP — CSS/SVG silhouette с морфом и scan-анимацией.

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/avatar` | Текущие параметры |
| GET | `/api/v1/avatar/transformation` | Дельты для weekly transformation animation |

---

### 2.10 AlertsModule

**Ответственность**: детерминированные алерты пользователю (плато силы, регресс, плато веса).

**Структура папок**:
```
src/modules/alerts/
├── alerts.module.ts
├── alerts.controller.ts
├── alerts.service.ts
├── alert.entity.ts
├── detectors/
│   ├── plateau-strength.detector.ts
│   ├── regression.detector.ts
│   ├── weight-plateau-cut.detector.ts
│   └── overtraining.detector.ts
└── __tests__/
```

**Детекторы** (запускаются ежедневно как Bull Job + при ключевых событиях):

| Детектор | Правило | Действие |
|----------|---------|----------|
| **plateauStrength** | e1RM/повторы на main_lift не растут 2-3 нед при adherence ≥ 80% | Предложить уменьшить объём или внеплановый делoad |
| **regression** | Падение e1RM/объёма > 5-8% на 2 тренировках подряд + рост session-RPE | Включить Recovery-неделю (делoad-шаблон) |
| **weightPlateauCut** | Цель=cut, вес не меняется 14 дней (по 7-дневному rolling avg) | Пересчитать TDEE: −100 ккал ИЛИ +1500 шагов/день |
| **overtraining** | session-RPE > 8 три недели подряд + сон < 6ч | Принудительный делoad |

**Alert entity**:

```typescript
{
  id: UUID,
  userId: UUID,
  type: AlertType,
  severity: 'info' | 'warning' | 'critical',
  title: string,        // "Плато по силе"
  message: string,      // "Жим лежа не растёт 3 недели"
  recommendation: string, // "Включаем делoad на следующей неделе"
  triggeredAt: timestamp,
  dismissedAt: timestamp | null,
  actedUpon: boolean,
}
```

**AlertsService — методы**:

| Метод | Описание |
|-------|----------|
| `runAllDetectors(userId)` | Запустить все детекторы (фоновый job) |
| `getActive(userId)` | Активные алерты |
| `dismiss(alertId, userId)` | Скрыть алерт |
| `actOn(alertId, userId)` | Применить рекомендацию (например, запустить делoad) |

**Контроллер**:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/alerts` | Активные алерты |
| POST | `/api/v1/alerts/:id/dismiss` | Скрыть |
| POST | `/api/v1/alerts/:id/act` | Применить рекомендацию |

---

## 3. База данных — PostgreSQL

### 3.1 ER-диаграмма (расширенная)

```
users 1──1 profiles
users 1──N pre_screenings              (история PAR-Q+)
users 1──N body_type_snapshots         (история scoring)
users 1──N avatar_snapshots            (история параметров)
users 1──N alerts                      (история алертов)
users 1──N training_programs
training_programs 1──N training_weeks  (с phase: adaptation/accumulation/...)
training_weeks 1──N training_days
training_days 1──N training_day_exercises
training_day_exercises N──1 exercises
training_day_exercises 1──N progress_logs
users 1──N session_rpe_logs            (общая тяжесть сессии)
users 1──N body_measurements
users 1──N nutrition_plans
nutrition_plans N──N meal_templates    (через nutrition_plan_meals)
exercises N──N movement_patterns       (массив паттернов)
exercises N──N joint_involvement       (массив суставов)
```

### 3.2 Таблицы

#### users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(50) NOT NULL,
  last_name     VARCHAR(50) NOT NULL,
  refresh_token_hash VARCHAR(255),
  is_active     BOOLEAN DEFAULT true,
  deleted_at    TIMESTAMP,              -- soft delete
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
```

#### profiles

```sql
CREATE TABLE profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- physicalProfile
  sex                         VARCHAR(10) NOT NULL,
  age_years                   SMALLINT NOT NULL,
  height_cm                   DECIMAL(5,1) NOT NULL,
  weight_kg                   DECIMAL(5,1) NOT NULL,
  waist_cm                    DECIMAL(5,1),

  -- trainingExperience
  experience_level            VARCHAR(15) NOT NULL,        -- none | novice | intermediate
  current_training_days_per_week SMALLINT NOT NULL,
  technical_confidence        VARCHAR(10),                  -- low | medium | high
  baseline_squat_kg           DECIMAL(5,1),
  baseline_bench_kg           DECIMAL(5,1),
  baseline_deadlift_kg        DECIMAL(5,1),
  baseline_pullups_max        SMALLINT,

  -- goalDefinition
  primary_training_goal       VARCHAR(20) NOT NULL,         -- strength | hypertrophy | fitness | endurance_mixed | sport_prep
  bodyweight_goal             VARCHAR(10) NOT NULL,         -- cut | maintain | bulk
  weekly_training_days_target SMALLINT NOT NULL,
  session_duration_minutes    SMALLINT NOT NULL,            -- 30/45/60/75/90

  -- constraintsAndLimitations
  equipment_access            VARCHAR(20) NOT NULL,         -- bodyweight | home_dumbbells | gym | advanced_gym
  injury_pain_flags           TEXT[] NOT NULL DEFAULT '{}', -- shoulder/knee/hip/...
  pre_screening_red_flags     BOOLEAN NOT NULL DEFAULT false,

  -- lifestyleFactors
  sleep_hours_avg             DECIMAL(3,1) NOT NULL,
  stress_level                VARCHAR(10) NOT NULL,         -- low | medium | high
  daily_activity_level        VARCHAR(15) NOT NULL,         -- sedentary | moderate | active
  nutrition_tier_preference   VARCHAR(15) NOT NULL,         -- budget | standard | advanced
  dietary_restrictions        TEXT[] NOT NULL DEFAULT '{}', -- vegetarian/vegan/halal/...

  -- derived (cached)
  bmi                         DECIMAL(4,1),
  ree                         INTEGER,
  tdee                        INTEGER,
  activity_factor             DECIMAL(3,2),

  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_profiles_user ON profiles(user_id);
```

#### pre_screenings

```sql
CREATE TABLE pre_screenings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers         JSONB NOT NULL,           -- { question_id: boolean }
  red_flags       BOOLEAN NOT NULL,
  red_flag_reasons TEXT[],                   -- список ID вопросов с YES
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_screenings_user ON pre_screenings(user_id);
CREATE INDEX idx_screenings_user_date ON pre_screenings(user_id, created_at DESC);
```

#### body_type_snapshots

```sql
CREATE TABLE body_type_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adiposity_score   DECIMAL(4,2) NOT NULL,
  muscularity_score DECIMAL(4,2) NOT NULL,
  linearity_score   DECIMAL(4,2) NOT NULL,
  classification    VARCHAR(15) NOT NULL,    -- ectomorph | mesomorph | endomorph | hybrid
  dominant_components TEXT[],                 -- для hybrid: ['muscularity', 'adiposity']
  confidence        VARCHAR(10) NOT NULL,    -- low | medium | high
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_body_type_user_date ON body_type_snapshots(user_id, created_at DESC);
```

#### avatar_snapshots

```sql
CREATE TABLE avatar_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_scale      DECIMAL(4,3) NOT NULL,
  shoulder_width    DECIMAL(4,3) NOT NULL,
  chest_depth       DECIMAL(4,3) NOT NULL,
  waist_width       DECIMAL(4,3) NOT NULL,
  hip_width         DECIMAL(4,3) NOT NULL,
  arm_girth         DECIMAL(4,3) NOT NULL,
  thigh_girth       DECIMAL(4,3) NOT NULL,
  muscle_definition DECIMAL(3,2) NOT NULL,    -- 0-1
  body_fat_layer    DECIMAL(3,2) NOT NULL,    -- 0-1
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_avatar_user_date ON avatar_snapshots(user_id, created_at DESC);
```

#### alerts

```sql
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,     -- plateau_strength | regression | weight_plateau_cut | overtraining
  severity        VARCHAR(10) NOT NULL,     -- info | warning | critical
  title           VARCHAR(100) NOT NULL,
  message         TEXT NOT NULL,
  recommendation  TEXT NOT NULL,
  context         JSONB,                     -- доп. данные (exercise_id, weeks, etc.)
  triggered_at    TIMESTAMP DEFAULT NOW(),
  dismissed_at    TIMESTAMP,
  acted_upon      BOOLEAN DEFAULT false,
  acted_at        TIMESTAMP
);

CREATE INDEX idx_alerts_user_active ON alerts(user_id) WHERE dismissed_at IS NULL;
CREATE INDEX idx_alerts_user_type ON alerts(user_id, type);
```

#### exercises (каталог)

```sql
CREATE TABLE exercises (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(60) NOT NULL UNIQUE,    -- "goblet_squat", "bench_press"
  name                VARCHAR(100) NOT NULL,
  name_ru             VARCHAR(100),
  description         TEXT,

  -- классификация
  movement_patterns   TEXT[] NOT NULL,                -- ['squat'] | ['hinge', 'core'] и т.п.
  primary_muscles     TEXT[] NOT NULL,
  secondary_muscles   TEXT[] DEFAULT '{}',
  joint_involvement   TEXT[] NOT NULL,                -- ['knee','hip']
  contraindications   TEXT[] DEFAULT '{}',            -- ['shoulder', 'lower_back'] — кому НЕЛЬЗЯ

  -- атрибуты
  equipment_required  TEXT[] NOT NULL,                -- ['barbell'] | ['bodyweight']
  equipment_access_min VARCHAR(20) NOT NULL,          -- минимальный уровень equipment_access
  difficulty          SMALLINT NOT NULL,              -- 1-5
  technical_demand    VARCHAR(10) NOT NULL,           -- low | medium | high

  -- прогрессия (цепочка вариантов от простого к сложному)
  progression_chain   TEXT[],                         -- ['knee_pushup', 'pushup', 'bench_press']
  progression_order   SMALLINT,                       -- позиция в цепочке (1, 2, 3...)

  -- медиа
  instructions        TEXT,
  video_url           VARCHAR(500),
  image_url           VARCHAR(500),

  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercises_movement_pattern ON exercises USING GIN(movement_patterns);
CREATE INDEX idx_exercises_equipment ON exercises USING GIN(equipment_required);
CREATE INDEX idx_exercises_contraindications ON exercises USING GIN(contraindications);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
```

#### training_programs

```sql
CREATE TABLE training_programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  status          VARCHAR(15) NOT NULL DEFAULT 'active',
  total_weeks     SMALLINT NOT NULL DEFAULT 12,        -- зафиксировано: 12
  primary_goal    VARCHAR(20) NOT NULL,                 -- из profiles.primary_training_goal
  experience_level VARCHAR(15) NOT NULL,
  split_type      VARCHAR(30) NOT NULL,                 -- 'full_body' | 'upper_lower' | 'ppl' | 'low_intensity'
  weekly_days     SMALLINT NOT NULL,
  is_low_intensity_mode BOOLEAN DEFAULT false,          -- если pre_screening red flags
  config_snapshot JSONB,                                 -- снапшот профиля на момент генерации
  started_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_programs_user ON training_programs(user_id);
CREATE INDEX idx_programs_user_active ON training_programs(user_id, status)
  WHERE status = 'active';
```

#### training_weeks

```sql
CREATE TABLE training_weeks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  week_number  SMALLINT NOT NULL,                          -- 1-12
  phase        VARCHAR(20) NOT NULL,                        -- adaptation | accumulation | intensification | deload
  mesocycle_number SMALLINT NOT NULL,                       -- 1, 2, 3
  description  VARCHAR(255),
  is_deload    BOOLEAN DEFAULT false,
  intensity_modifier DECIMAL(3,2) NOT NULL DEFAULT 1.0,    -- 0.7 для адаптации, 1.0 для пика, 0.6 для делoad
  volume_modifier    DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weeks_program ON training_weeks(program_id);
CREATE UNIQUE INDEX idx_weeks_program_number ON training_weeks(program_id, week_number);
```

#### training_days

```sql
CREATE TABLE training_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id       UUID NOT NULL REFERENCES training_weeks(id) ON DELETE CASCADE,
  day_number    SMALLINT NOT NULL,          -- 1-7
  name          VARCHAR(50) NOT NULL,       -- "Грудь + Трицепс", "Ноги"
  description   TEXT,
  target_muscles TEXT[] NOT NULL,            -- целевые группы мышц
  is_rest_day   BOOLEAN DEFAULT false,
  started_at    TIMESTAMP,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_days_week ON training_days(week_id);
CREATE UNIQUE INDEX idx_days_week_number ON training_days(week_id, day_number);
```

#### training_day_exercises (связь день-упражнение)

```sql
CREATE TABLE training_day_exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id        UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
  exercise_id   UUID NOT NULL REFERENCES exercises(id),
  role          VARCHAR(15) NOT NULL,      -- main_lift | accessory | finisher | warmup
  order_index   SMALLINT NOT NULL,
  sets          SMALLINT NOT NULL,
  reps_min      SMALLINT NOT NULL,
  reps_max      SMALLINT NOT NULL,
  target_rir    SMALLINT,                  -- целевой RIR для авторегуляции (default 2-3)
  target_load_kg DECIMAL(5,1),             -- если есть baseline или после калибровки
  load_pct_e1rm DECIMAL(4,1),              -- если используется percent-based mode
  rest_seconds  SMALLINT DEFAULT 90,
  tempo         VARCHAR(10),               -- "3-1-2-0"
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_day_exercises_day ON training_day_exercises(day_id);
CREATE UNIQUE INDEX idx_day_exercises_order ON training_day_exercises(day_id, order_index);
```

#### progress_logs

```sql
CREATE TABLE progress_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id       UUID NOT NULL REFERENCES exercises(id),
  training_day_id   UUID REFERENCES training_days(id),
  day_exercise_id   UUID REFERENCES training_day_exercises(id),
  set_number        SMALLINT NOT NULL,
  weight_kg         DECIMAL(6,2) NOT NULL,
  reps              SMALLINT NOT NULL,
  rir               SMALLINT,                 -- Reps In Reserve 0-5 (приоритетный)
  rpe               DECIMAL(3,1),             -- Rate of Perceived Exertion 1-10 (альт.)
  estimated_1rm     DECIMAL(6,2),             -- e1RM по формуле Эпли (рассчитывается при записи)
  volume_load       DECIMAL(8,2),             -- weight * reps (для агрегации)
  is_warmup         BOOLEAN DEFAULT false,
  notes             TEXT,
  performed_at      TIMESTAMP DEFAULT NOW(),
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_progress_user ON progress_logs(user_id);
CREATE INDEX idx_progress_user_exercise ON progress_logs(user_id, exercise_id);
CREATE INDEX idx_progress_user_date ON progress_logs(user_id, performed_at);
CREATE INDEX idx_progress_day ON progress_logs(training_day_id);
```

#### session_rpe_logs

```sql
CREATE TABLE session_rpe_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
  session_rpe     DECIMAL(3,1) NOT NULL,    -- 1-10
  duration_minutes SMALLINT NOT NULL,
  internal_load   DECIMAL(8,2) NOT NULL,    -- session_rpe * duration_minutes
  recorded_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_rpe_user ON session_rpe_logs(user_id);
CREATE INDEX idx_session_rpe_user_date ON session_rpe_logs(user_id, recorded_at);
```

#### body_measurements

```sql
CREATE TABLE body_measurements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg        DECIMAL(5,1) NOT NULL,
  body_fat_percent DECIMAL(4,1),
  chest_cm         DECIMAL(5,1),
  waist_cm         DECIMAL(5,1),
  hips_cm          DECIMAL(5,1),
  biceps_cm        DECIMAL(4,1),
  thigh_cm         DECIMAL(5,1),
  photo_url        VARCHAR(500),
  measured_at      TIMESTAMP DEFAULT NOW(),
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_measurements_user ON body_measurements(user_id);
CREATE INDEX idx_measurements_user_date ON body_measurements(user_id, measured_at);
```

#### nutrition_plans

```sql
CREATE TABLE nutrition_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                VARCHAR(15) NOT NULL,        -- budget | standard | advanced
  bodyweight_goal     VARCHAR(10) NOT NULL,        -- cut | maintain | bulk
  current_phase       VARCHAR(20),                  -- adaptation | accumulation | intensification | deload
  calories_target     SMALLINT NOT NULL,
  protein_g           SMALLINT NOT NULL,
  fat_g               SMALLINT NOT NULL,
  carbs_g             SMALLINT NOT NULL,
  protein_per_meal_g  SMALLINT NOT NULL,            -- 0.25 г/кг или 20-40 г
  meals_per_day       SMALLINT NOT NULL DEFAULT 4,
  supplements         JSONB,                         -- [{ name, dose, notes }] для advanced
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nutrition_user ON nutrition_plans(user_id);
CREATE INDEX idx_nutrition_user_active ON nutrition_plans(user_id)
  WHERE is_active = true;
```

#### meal_templates (общий каталог шаблонов)

```sql
CREATE TABLE meal_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(60) UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  tier            VARCHAR(15) NOT NULL,        -- budget | standard | advanced
  meal_type       VARCHAR(15) NOT NULL,        -- breakfast | lunch | dinner | snack | pre_workout | post_workout
  day_template    VARCHAR(25) NOT NULL,        -- training_day | rest_day | heavy_training_day
  calories        SMALLINT NOT NULL,
  protein_g       DECIMAL(5,1) NOT NULL,
  fat_g           DECIMAL(5,1) NOT NULL,
  carbs_g         DECIMAL(5,1) NOT NULL,
  ingredients     JSONB NOT NULL,              -- [{ name, amount, unit }]
  instructions    TEXT,
  dietary_tags    TEXT[] NOT NULL DEFAULT '{}', -- vegetarian/vegan/halal/lactose_free/gluten_free
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_templates_tier_type ON meal_templates(tier, meal_type);
CREATE INDEX idx_meal_templates_dietary ON meal_templates USING GIN(dietary_tags);
```

#### nutrition_plan_meals (M:N связь план-шаблон)

```sql
CREATE TABLE nutrition_plan_meals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES meal_templates(id),
  day_type        VARCHAR(25) NOT NULL,       -- training_day | rest_day | heavy_training_day
  order_index     SMALLINT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_npm_plan ON nutrition_plan_meals(plan_id);
```

### 3.3 Стратегия индексирования

| Паттерн запроса | Индекс | Обоснование |
|----------------|--------|-------------|
| Поиск пользователя по email | `idx_users_email` (partial, unique) | Логин — горячий путь |
| Профиль по user_id | `idx_profiles_user` (unique) | 1:1 связь, частый запрос |
| Активная программа | `idx_programs_user_active` (partial) | Фильтр по status='active' |
| Прогресс за период | `idx_progress_user_date` | Range scan по дате |
| Прогресс по упражнению | `idx_progress_user_exercise` | Графики прогресса |
| Замеры по дате | `idx_measurements_user_date` | Графики замеров |

---

## 4. Training Engine — ядро логики

### 4.1 Принципы

- **Чистые функции**: никаких побочных эффектов, зависимостей от БД, API
- **Детерминизм**: одинаковый input -> одинаковый output
- **Тестируемость**: 100% покрытие unit-тестами
- **Отдельный модуль**: `src/modules/training-engine/`

### 4.2 Структура

```
src/modules/training-engine/
├── training-engine.module.ts
├── training-engine.service.ts
├── generators/
│   ├── program-generator.ts        — генерация структуры программы
│   ├── week-generator.ts           — генерация недель с периодизацией
│   ├── day-generator.ts            — генерация тренировочных дней
│   └── exercise-selector.ts        — подбор упражнений
├── calculators/
│   ├── progression-calculator.ts   — расчет прогрессии весов
│   ├── volume-calculator.ts        — расчет тренировочного объема
│   ├── intensity-calculator.ts     — расчет интенсивности
│   └── deload-calculator.ts        — определение необходимости разгрузки
├── interfaces/
│   ├── program-config.interface.ts
│   ├── generated-program.interface.ts
│   └── exercise-criteria.interface.ts
├── constants/
│   ├── muscle-group-splits.ts      — шаблоны сплитов
│   ├── rep-ranges.ts               — диапазоны повторений по целям
│   └── progression-rates.ts        — коэффициенты прогрессии
└── __tests__/
    ├── program-generator.spec.ts
    ├── exercise-selector.spec.ts
    └── progression-calculator.spec.ts
```

### 4.3 TrainingEngineService — API

```typescript
class TrainingEngineService {
  /**
   * Главный метод: генерация полной программы.
   * Принимает профиль и каталог упражнений, возвращает
   * полную структуру программы для сохранения в БД.
   */
  generateProgram(
    profile: ProfileConfig,
    exerciseCatalog: ExerciseCatalogItem[]
  ): GeneratedProgram;

  /**
   * Расчет прогрессии для следующей недели
   * на основе логов текущей недели и плана предыдущей.
   */
  calculateProgression(
    currentWeekLogs: WeekLogs,
    previousWeekPlan: WeekPlan
  ): ProgressionResult;

  /**
   * Определить, нужна ли разгрузочная неделя.
   */
  shouldDeload(
    weekNumber: number,
    recentRPE: number[],
    progressionRate: number
  ): boolean;
}
```

### 4.4 Алгоритм генерации 12-недельной программы

**Step 1 — Pre-screening gate**:
```
if profile.preScreeningRedFlags === true:
  return generateLowIntensityProgram(profile)
  // bodyweight only, max 3 дня/нед, target_rir=4, фиксированный шаблон
```

**Step 2 — Выбор сплита по `weeklyTrainingDaysTarget` + `experienceLevel`**:

| Дней/нед | Сплит |
|---------|-------|
| 2-3 | **Full Body A/B/C** (каждый день: squat/hinge + push + pull + core) |
| 4 | **Upper/Lower** (Upper A — Lower A — Upper B — Lower B) |
| 5 | **Upper/Lower + Full Body accessories** ИЛИ **PPL+UL** |
| 6 | **PPL x2** (Push/Pull/Legs дважды) — только если sleep≥7 + stress≠high |

**Beginner cap**: novice не получает > 4 трен/нед, даже если запросил больше.

**Step 3 — Определение фаз для всех 12 недель**:

```typescript
const PHASES = {
  1: { phase: 'adaptation', mesocycle: 1, intensity: 0.75, volume: 0.85 },
  2: { phase: 'adaptation', mesocycle: 1, intensity: 0.80, volume: 0.95 },
  3: { phase: 'adaptation', mesocycle: 1, intensity: 0.85, volume: 1.00 },
  4: { phase: 'deload',     mesocycle: 1, intensity: 0.65, volume: 0.55 },
  5: { phase: 'accumulation', mesocycle: 2, intensity: 0.80, volume: 1.05 },
  6: { phase: 'accumulation', mesocycle: 2, intensity: 0.82, volume: 1.10 },
  7: { phase: 'accumulation', mesocycle: 2, intensity: 0.85, volume: 1.15 },
  8: { phase: 'deload',       mesocycle: 2, intensity: 0.65, volume: 0.55 },
  9: { phase: 'intensification', mesocycle: 3, intensity: 0.90, volume: 0.90 },
  10:{ phase: 'intensification', mesocycle: 3, intensity: 0.93, volume: 0.85 },
  11:{ phase: 'intensification', mesocycle: 3, intensity: 0.95, volume: 0.80 },
  12:{ phase: 'deload',          mesocycle: 3, intensity: 0.60, volume: 0.50 },
};
```

**Step 4 — Подбор упражнений**:

a. Покрытие паттернов:
- Каждая неделя должна покрывать: squat, hinge, horizontalPush/verticalPush, horizontalPull/verticalPull, core
- Carry/lunge — опционально

b. Фильтрация по `equipment_required ⊆ user.equipmentAccess`

c. Фильтрация по травмам:
- Если `injuryPainFlags` содержит joint X → исключить exercises с `contraindications` содержащими X

d. Выбор main_lift (фиксируется на 4 недели мезоцикла):
- 1 main_lift на ключевой паттерн (squat / hinge / push / pull)
- Сложность по `experience_level`: novice → difficulty 1-2, intermediate → 2-4

e. Выбор accessories (ротируется каждые 1-2 недели):
- 2-4 accessory на день в зависимости от `sessionDurationMinutes`

f. Количество упражнений по длительности сессии:
- 30 мин → 3 упражнения
- 45 мин → 4
- 60 мин → 5
- 75 мин → 6
- 90 мин → 7

**Step 5 — Параметры подходов по `primaryTrainingGoal`**:

| Goal | Sets | Reps | Target RIR | Rest |
|------|------|------|------------|------|
| strength | 3-5 | 3-6 | 1-2 | 180s |
| hypertrophy | 3-4 | 8-12 | 2-3 | 90s |
| fitness | 2-3 | 10-15 | 3 | 60s |
| endurance_mixed | 2-3 | 15-20 | 3 | 45s |
| sport_prep | 3-4 | 5-8 | 2 | 120s |

Применить `intensity_modifier` и `volume_modifier` фазы.

**Step 6 — Lifestyle adjustments**:

- `stressLevel === 'high'` ИЛИ `sleepHoursAvg < 6`:
  - снизить `volume_modifier` на 0.1 на первые 2 недели
  - target_rir +1 (более консервативно)
- `dailyActivityLevel === 'sedentary'`:
  - первая неделя — без accessories, только main_lifts

### 4.5 Алгоритм прогрессии (Double Progression + Autoregulation)

**Mode A — RIR-based (default для MVP)**:

```
Для каждого упражнения после тренировки:

1. Собрать факт по подходам: actual_reps, actual_rir
2. Проверить выполнение цели (reps в диапазоне reps_min..reps_max при RIR ≤ target_rir):
   - Все подходы достигли reps_max при RIR ≤ target_rir → READY_FOR_LOAD_INCREASE
   - Все в диапазоне → HOLD (повторить на след. неделе)
   - Не дотянул → REGRESS

3. Действия:
   - READY_FOR_LOAD_INCREASE (2 раза подряд):
     +2.5 кг (compound) / +1.25 кг (isolation), сбросить reps на reps_min
     Лимит: max +10% за неделю
   - HOLD: оставить вес, цель — добавить 1 повтор
   - REGRESS: −2-5% веса ИЛИ убрать 1 подход
```

**Mode B — Percent-based (если есть `baselineStrengthOptional`)**:

```
target_load_kg = e1RM * load_pct_e1rm
% от e1RM по фазе:
  adaptation: 60-70%
  accumulation: 65-75%
  intensification: 80-90%
  deload: 50-60%
```

**Принудительный делoad**:

```
if RIR avg < 1 для 3 недель подряд (постоянно близко к отказу)
   OR session_RPE avg > 9 для 3 недель
   OR e1RM падает > 5% на 2 тренировках:
  → запустить deload не дожидаясь плановой недели
```

---

## 5. API Design

### 5.1 Общие соглашения

- Базовый URL: `/api/v1/`
- Формат: JSON
- Аутентификация: Bearer JWT в заголовке `Authorization`
- Ошибки: стандартный формат `{ statusCode, message, error }`
- Пагинация: `?page=1&limit=20` -> `{ data: [], meta: { total, page, limit, totalPages } }`
- Даты: ISO 8601 (`2026-04-13T10:30:00Z`)

### 5.2 Примеры запросов/ответов

#### POST /api/v1/auth/register

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "firstName": "Иван",
  "lastName": "Петров"
}
```

**Response** (201):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "Иван",
  "lastName": "Петров",
  "createdAt": "2026-04-13T10:00:00Z"
}
```

#### POST /api/v1/profile

**Request**:
```json
{
  "gender": "male",
  "age": 28,
  "heightCm": 180,
  "weightKg": 82,
  "goal": "muscle_gain",
  "fitnessLevel": "intermediate",
  "bodyType": "mesomorph",
  "trainingDaysPerWeek": 4,
  "sessionDurationMinutes": 60,
  "availableEquipment": ["barbell", "dumbbells", "cable_machine", "pull_up_bar"],
  "injuries": [],
  "excludedExercises": []
}
```

**Response** (201):
```json
{
  "id": "...",
  "userId": "...",
  "gender": "male",
  "age": 28,
  "heightCm": 180,
  "weightKg": 82,
  "goal": "muscle_gain",
  "fitnessLevel": "intermediate",
  "bmi": 25.3,
  "tdee": 2750,
  "createdAt": "..."
}
```

#### POST /api/v1/training/generate

**Response** (201):
```json
{
  "id": "...",
  "name": "Muscle Gain — Upper/Lower 4x",
  "status": "active",
  "totalWeeks": 8,
  "weeks": [
    {
      "weekNumber": 1,
      "description": "Адаптационная неделя",
      "isDeload": false,
      "days": [
        {
          "dayNumber": 1,
          "name": "Upper Body A",
          "targetMuscles": ["chest", "back", "shoulders"],
          "exercises": [
            {
              "exerciseId": "...",
              "name": "Жим штанги лежа",
              "sets": 4,
              "repsMin": 8,
              "repsMax": 12,
              "restSeconds": 90,
              "orderIndex": 1
            }
          ]
        }
      ]
    }
  ]
}
```

#### POST /api/v1/progress/log

**Request**:
```json
{
  "exerciseId": "...",
  "trainingDayId": "...",
  "setNumber": 1,
  "weightKg": 80,
  "reps": 10,
  "rpe": 8
}
```

**Response** (201):
```json
{
  "id": "...",
  "exerciseId": "...",
  "setNumber": 1,
  "weightKg": 80,
  "reps": 10,
  "rpe": 8,
  "performedAt": "2026-04-13T18:30:00Z"
}
```

#### GET /api/v1/analytics/dashboard

**Response** (200):
```json
{
  "currentProgram": {
    "name": "Muscle Gain — Upper/Lower 4x",
    "weekNumber": 3,
    "totalWeeks": 8,
    "completedDays": 10,
    "totalDays": 32
  },
  "weekProgress": {
    "planned": 4,
    "completed": 2,
    "upcoming": [
      { "dayId": "...", "name": "Lower Body B", "dayNumber": 4 }
    ]
  },
  "recentRecords": [
    { "exercise": "Жим лежа", "value": 100, "unit": "kg", "date": "2026-04-10" }
  ],
  "bodyWeight": [
    { "date": "2026-03-15", "value": 82 },
    { "date": "2026-03-22", "value": 81.5 },
    { "date": "2026-04-01", "value": 81.8 }
  ],
  "totalVolume": [
    { "date": "2026-03-25", "value": 15200, "label": "Неделя 1" },
    { "date": "2026-04-01", "value": 17800, "label": "Неделя 2" }
  ],
  "consistencyScore": 87
}
```

### 5.3 Правила валидации

| Поле | Правило |
|------|---------|
| email | Валидный email, уникальный |
| password | Минимум 8 символов, хотя бы 1 заглавная, 1 цифра |
| age | 14-100 |
| heightCm | 100-250 |
| weightKg | 30-300 |
| trainingDaysPerWeek | 1-7 |
| sessionDurationMinutes | 20-180 |
| rpe | 1-10, шаг 0.5 |
| sets | 1-10 |
| reps | 0-100 |
| weightKg (progress) | 0-500 |

---

## 6. Frontend — Next.js

### 6.1 Структура страниц (App Router)

```
app/
├── layout.tsx                    — корневой layout (providers, навигация)
├── page.tsx                      — лендинг / редирект
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx               — layout для auth-страниц
├── (app)/
│   ├── layout.tsx               — layout с sidebar/navbar (protected)
│   ├── onboarding/
│   │   ├── page.tsx             — мультишаговая форма профиля (8 шагов)
│   │   └── screening/page.tsx   — PAR-Q+ скрининг (отдельный шаг до основного)
│   ├── dashboard/
│   │   └── page.tsx             — главная панель + 2-3 weekly insights
│   ├── avatar/
│   │   └── page.tsx             — голограф-аватар + transformation animation
│   ├── training/
│   │   ├── page.tsx             — обзор 12-нед программы (фазы/мезоциклы)
│   │   ├── [programId]/page.tsx
│   │   ├── day/[dayId]/page.tsx — воркаут с RIR/RPE input + session-RPE в конце
│   │   └── history/page.tsx
│   ├── nutrition/
│   │   ├── page.tsx             — план питания (тир + макросы + меню)
│   │   └── tier/page.tsx        — смена тира (budget/standard/advanced)
│   ├── progress/
│   │   ├── page.tsx             — замеры тела + графики (e1RM, volume load, sRPE)
│   │   └── records/page.tsx
│   ├── alerts/
│   │   └── page.tsx             — список активных алертов с действиями
│   └── settings/
│       └── page.tsx             — настройки профиля + lifestyle переоценка
└── not-found.tsx
```

### 6.2 Компонентная структура

```
components/
├── ui/                          — базовые UI-компоненты
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Skeleton.tsx
│   ├── Spinner.tsx
│   └── Toast.tsx
├── layout/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   └── PageHeader.tsx
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ProtectedRoute.tsx
├── onboarding/
│   ├── OnboardingWizard.tsx     — 8-шаговый визард
│   ├── StepPreScreening.tsx     — PAR-Q+ опросник (gate before остальных шагов)
│   ├── StepPersonalInfo.tsx     — sex, age
│   ├── StepBodyMetrics.tsx      — height, weight, waist (опц.)
│   ├── StepExperience.tsx       — experience_level, current days, technical confidence
│   ├── StepGoals.tsx            — primary_goal, bodyweight_goal, weekly_days_target, session_duration
│   ├── StepEquipment.tsx        — equipment_access, injury_pain_flags
│   ├── StepLifestyle.tsx        — sleep, stress, daily_activity, nutrition_tier, dietary_restrictions
│   ├── StepBaselineStrength.tsx — опционально (squat/bench/dl/pullups)
│   └── StepSummary.tsx          — BMI, TDEE, body type preview, что будет в программе
├── avatar/
│   ├── HologramAvatar.tsx       — основной 3D-канвас (Three.js)
│   ├── AvatarShader.tsx         — fresnel/scanlines shader
│   ├── AvatarMorphController.tsx — управление morph-targets
│   ├── AvatarFallback2D.tsx     — SVG-силуэт для слабых устройств
│   └── TransformationTimeline.tsx — анимация изменений по неделям
├── dashboard/
│   ├── DashboardStats.tsx
│   ├── WeekProgress.tsx
│   ├── UpcomingWorkout.tsx
│   ├── RecentRecords.tsx
│   └── QuickActions.tsx
├── training/
│   ├── ProgramOverview.tsx      — 12 недель + индикация фаз (adaptation/accumulation/intensification/deload)
│   ├── PhaseIndicator.tsx       — визуализация текущей фазы
│   ├── WeekView.tsx
│   ├── DayCard.tsx
│   ├── ExerciseCard.tsx         — с пометкой role (main_lift / accessory)
│   ├── ExerciseSetRow.tsx       — поля: weight, reps, RIR (или RPE) переключатель
│   ├── RIRPicker.tsx            — селектор 0-5 с пояснениями ("0 = до отказа", "3 = легко")
│   ├── PrevResultBadge.tsx      — предыдущий результат для сравнения
│   ├── WorkoutTimer.tsx         — таймер отдыха (берёт rest_seconds из плана)
│   ├── SessionRPEPrompt.tsx     — модалка в конце: "Оцени общую тяжесть тренировки 1-10"
│   ├── WorkoutComplete.tsx      — экран завершения с volume load и e1RM-апдейтом
│   └── ExerciseCatalog.tsx
├── alerts/
│   ├── AlertBanner.tsx          — баннер сверху страницы
│   ├── AlertCard.tsx            — карточка с recommendation + actions
│   └── AlertsList.tsx
├── nutrition/
│   ├── NutritionOverview.tsx
│   ├── MacrosPieChart.tsx
│   └── MealCard.tsx
├── progress/
│   ├── BodyMeasurementForm.tsx
│   ├── MeasurementHistory.tsx
│   ├── PersonalRecordCard.tsx
│   └── ProgressPhoto.tsx
└── charts/
    ├── WeightChart.tsx              — динамика веса (raw + 7/14-day rolling avg)
    ├── VolumeLoadChart.tsx          — Σ(sets × reps × weight) по неделям
    ├── InternalLoadChart.tsx        — session-RPE × duration по неделям
    ├── E1RMChart.tsx                — estimated 1RM по main_lifts
    ├── BestSetChart.tsx             — лучший подход по упражнению
    ├── ExerciseProgressChart.tsx    — комплексный график прогресса
    ├── BodyCompositionChart.tsx     — обхваты
    ├── ConsistencyChart.tsx         — adherence %
    ├── AvgRIRChart.tsx              — средний RIR по main_lifts (если ≈ 0 — overtraining risk)
    └── MacrosChart.tsx              — распределение БЖУ
```

### 6.3 Описание ключевых страниц

#### Onboarding (`/onboarding`)

Мультишаговый визард из 9 шагов (PreScreening — обязательный gate):

1. **PreScreening (PAR-Q+)** — 7-8 вопросов «да/нет». При redFlags: предупреждение и пометка профиля → LOW_INTENSITY режим.
2. **Personal Info** — имя, sex, age
3. **Body Metrics** — height, weight, waist (опц.)
4. **Experience** — experience_level (none/novice/intermediate), current_training_days, technical_confidence
5. **Goals** — primary_training_goal, bodyweight_goal, weekly_days_target, session_duration
6. **Equipment & Injuries** — equipment_access (4 варианта), injury_pain_flags (multi-select)
7. **Lifestyle** — sleep_hours, stress, daily_activity, nutrition_tier, dietary_restrictions
8. **Baseline Strength (опц.)** — squat/bench/deadlift/pullups, если знает (иначе — week 1 будет калибровкой через RIR)
9. **Summary** — BMI, TDEE, body type preview (scoring), какая будет программа (12 нед, сплит, фазы)

Состояние формы — локальный `useState` + black-listed на zod схемах. На submit:
- POST /screening (с ответами PAR-Q+)
- POST /profile (с остальными полями + preScreeningRedFlags)
- POST /training/generate (запускается автоматически)
- POST /nutrition/generate
- Редирект на dashboard

#### Dashboard (`/dashboard`)

- **DashboardStats**: карточки с ключевыми метриками (текущая неделя, consistency score, вес)
- **WeekProgress**: прогресс-бар текущей недели, какие тренировки выполнены
- **UpcomingWorkout**: следующая тренировка с кнопкой "Начать"
- **RecentRecords**: последние персональные рекорды
- **QuickActions**: быстрые действия (записать замер, начать тренировку)

#### Training Day (`/training/day/[dayId]`)

Экран активной тренировки:
- Список упражнений с подходами
- Для каждого подхода: поля ввода (вес, повторения)
- Таймер отдыха между подходами
- Предыдущий результат рядом (для сравнения)
- Кнопка завершения тренировки
- Экран с результатами после завершения

#### Progress (`/progress`)

- Форма добавления замеров (вес, обхваты, фото)
- Графики: вес тела, обхваты, % жира (по времени)
- Таблица персональных рекордов

### 6.4 Стратегия кэширования (RTK Query)

| Данные | keepUnusedDataFor | Инвалидация |
|--------|-------------------|-------------|
| Профиль | 600с (10 мин) | При обновлении профиля |
| Pre-screening | 3600с | При повторном прохождении |
| Body type / scoring | 300с | При обновлении замеров/профиля |
| Avatar params | 300с | При обновлении замеров |
| Активная программа | 300с (5 мин) | При генерации новой |
| Тренировочный день | 60с | При записи подхода |
| Дашборд | 120с | При любом изменении прогресса |
| Алерты | 60с | При dismiss/act |
| Аналитика | 300с | При записи подхода/замера |
| Каталог упражнений | 3600с (1 час) | Редко меняется |
| План питания | 600с | При смене тира / recalibrate |
| Шаблоны меню | 3600с | Редко меняется |

---

## 7. State Management — RTK Query

### 7.1 Структура стора

```
store/
├── store.ts                     — конфигурация стора
├── api/
│   ├── baseApi.ts               — базовый API с baseQuery + reauth
│   ├── authApi.ts               — auth endpoints
│   ├── profileApi.ts            — profile endpoints
│   ├── screeningApi.ts          — pre-screening endpoints
│   ├── bodyTypeApi.ts           — body type / scoring
│   ├── avatarApi.ts             — avatar params + transformation
│   ├── trainingApi.ts           — training endpoints
│   ├── nutritionApi.ts          — nutrition endpoints (3 тира)
│   ├── progressApi.ts           — progress + session-RPE
│   ├── analyticsApi.ts          — analytics endpoints
│   └── alertsApi.ts             — alerts endpoints
├── slices/
│   ├── authSlice.ts             — токены, текущий пользователь
│   ├── workoutSlice.ts          — состояние активной тренировки (timer, current set)
│   └── uiSlice.ts               — UI-состояние (модалки, сайдбар, RIR vs RPE preference)
└── hooks.ts                     — типизированные хуки
```

**tagTypes** в baseApi:
```
['Profile', 'Screening', 'BodyType', 'Avatar', 'Program',
 'TrainingDay', 'Progress', 'SessionRPE', 'Measurements',
 'Analytics', 'Nutrition', 'Alerts', 'MealTemplate']
```

### 7.2 Base API с автообновлением токена

```typescript
// baseApi.ts — ключевые моменты:
// 1. baseQuery с prepareHeaders — вставляет JWT из стора
// 2. baseQueryWithReauth — перехватывает 401, обновляет токен, ретраит
// 3. tagTypes для инвалидации кэша

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Обертка: при 401 → refresh → retry
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api, extraOptions
    );
    if (refreshResult.data) {
      api.dispatch(setTokens(refreshResult.data));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Profile', 'Program', 'TrainingDay',
    'Progress', 'Measurements', 'Analytics', 'Nutrition'
  ],
  endpoints: () => ({}),
});
```

### 7.3 API Slices — ключевые эндпоинты

#### trainingApi

```typescript
generateProgram:   mutation<Program, void>         → invalidates ['Program', 'Analytics']
getActiveProgram:  query<Program, void>            → provides ['Program'], TTL 300s
getTrainingDay:    query<TrainingDay, string>       → provides ['TrainingDay'], TTL 60s
startDay:          mutation<void, string>           → invalidates ['TrainingDay']
completeDay:       mutation<void, string>           → invalidates ['Program', 'Analytics']
completeExercise:  mutation<ProgressLog, dto>       → invalidates ['TrainingDay', 'Progress', 'Analytics']
getExerciseCatalog: query<Exercise[], filters>      → TTL 3600s
```

#### progressApi

```typescript
logProgress:       mutation<ProgressLog, dto>       → invalidates ['Progress', 'Analytics']
getProgressLogs:   query<Paginated<ProgressLog>>    → provides ['Progress']
getPersonalRecords: query<PersonalRecord[]>         → provides ['Progress']
addMeasurement:    mutation<BodyMeasurement, dto>   → invalidates ['Measurements', 'Analytics']
getMeasurements:   query<BodyMeasurement[]>         → provides ['Measurements']
```

#### analyticsApi

```typescript
getDashboard:      query<DashboardResponse>         → provides ['Analytics'], TTL 120s
getExerciseProgress: query<ChartDataPoint[]>        → provides ['Analytics'], TTL 300s
getVolumeAnalytics: query<ChartDataPoint[]>         → provides ['Analytics']
getBodyComposition: query<ChartDataPoint[]>         → provides ['Analytics', 'Measurements']
```

### 7.4 Стратегия инвалидации

```
Событие                       → Инвалидируемые теги
─────────────────────────────────────────────────────────────────────
Прохождение PAR-Q+            → Screening
Запись подхода (с RIR)        → TrainingDay, Progress, Analytics, Alerts
Запись session-RPE            → SessionRPE, Analytics, Alerts
Завершение тренировки         → Program, Analytics, Alerts
Добавление замера тела        → Measurements, Analytics, BodyType, Avatar
Обновление профиля            → Profile, Program (regenerate), BodyType, Avatar, Nutrition
Генерация программы           → Program, Analytics, Alerts
Смена тира питания            → Nutrition
Recalibrate питания           → Nutrition
Dismiss алерта                → Alerts
Применение recommendation     → Alerts, Program (если делoad), Analytics
```

---

## 8. Визуализация

### 8.1 Библиотека: Recharts

### 8.2 Графики и формат данных (sport-research → analytics.graphs)

| График | Тип | Данные | Использование |
|--------|-----|--------|---------------|
| Weight over time | LineChart + 7/14-day rolling avg | `{ date, weightKg, avg7d, avg14d }[]` | Тренд, recalibration |
| Volume load | BarChart | `{ week, volumeLoad }[]` где `Σ(sets*reps*load)` | Внешняя нагрузка |
| Internal load (sRPE) | BarChart | `{ week, internalLoad }[]` где `Σ(sessionRPE*duration)` | Внутренняя нагрузка |
| Strength progression | LineChart, groupBy main_lift | `{ week, e1RM, exercise }[]` | Сила во времени |
| Best set | LineChart | `{ date, bestSet: { weight, reps } }[]` | Лучший подход |
| Avg RIR main lifts | LineChart | `{ week, avgRIR }[]` | Если ≈ 0 → overtraining |
| Body composition | LineChart multi-line | `{ date, chest, waist, hips, biceps }[]` | Обхваты |
| Macros distribution | PieChart | `{ name, value, color }[]` | БЖУ |
| Adherence | BarChart | `{ week, completedPercent }[]` | Регулярность |

### 8.3 Трансформационный слой

```typescript
// utils/chart-transforms.ts

// progress_logs → график прогресса упражнения
transformExerciseProgress(logs): ExerciseProgressData[]

// body_measurements → график веса с rolling avg
transformBodyWeight(measurements): { date, weightKg, avg7d, avg14d }[]

// progress_logs → volume load по неделям
transformWeeklyVolumeLoad(logs): { week, volumeLoad }[]

// session_rpe_logs → internal load по неделям
transformWeeklyInternalLoad(logs): { week, internalLoad }[]

// progress_logs → e1RM по main_lifts
transformE1RMByMainLifts(logs, mainLifts): { week, e1RM, exercise }[]

// Estimated 1RM по формуле Эпли: weight * (1 + reps / 30)
calculateEstimated1RM(weight, reps): number

// RIR ↔ RPE маппинг
rirToRPE(rir, reps): number  // RPE = 10 - RIR
rpeToRIR(rpe, reps): number

// Rolling average
calculateRollingAverage(values, windowDays): number[]
```

---

## 9. Производительность и масштабирование

### 9.1 Индексирование БД

- **Partial indexes**: `WHERE status = 'active'`, `WHERE deleted_at IS NULL` — сужают индекс до горячих данных
- **Composite indexes**: `(user_id, performed_at)` для progress_logs — покрывает 90% запросов аналитики
- **Мониторинг**: `pg_stat_user_indexes` для отслеживания неиспользуемых индексов

### 9.2 Кэширование (Redis)

| Ключ | TTL | Данные |
|------|-----|--------|
| `dashboard:{userId}` | 2 мин | Ответ GET /analytics/dashboard |
| `program:active:{userId}` | 5 мин | Активная программа |
| `catalog:exercises` | 1 час | Каталог упражнений |
| `records:{userId}` | 5 мин | Персональные рекорды |

Инвалидация: при записи прогресса — удалить `dashboard:*` и `records:*` для пользователя.

### 9.3 Пагинация

- **Offset-based** для списков с фильтрами: `?page=1&limit=20`
- **Cursor-based** для бесконечного скролла: `?cursor={id}&limit=20`

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
```

### 9.4 Фоновые задачи (Bull Queue)

| Задача | Триггер | Описание |
|--------|---------|----------|
| `recalculate-analytics` | После завершения тренировки | Пересчет агрегатов дашборда |
| `check-progression` | После завершения недели | TrainingEngine.calculateProgression() для следующей |
| `run-alert-detectors` | Cron (ежедневно 6:00) + после каждой тренировки | Запуск всех detector'ов AlertsModule |
| `recalibrate-nutrition` | Cron (еженедельно) | Пересчёт калорий по 14-day weight trend |
| `recalculate-body-scoring` | После добавления замера/обновления профиля | BodyTypeService.recalculate + AvatarService.recalculate |
| `weekly-report` | Cron (понедельник 9:00) | Генерация недельного отчёта + 2-3 UX-инсайтов |
| `cleanup-expired-tokens` | Cron (ежедневно 3:00) | Удаление просроченных refresh токенов |

### 9.5 Оптимизация запросов

- **Eager loading**: загружать упражнения и последние логи за один запрос (TypeORM `relations`)
- **Select**: запрашивать только нужные поля (`.select()`)
- **Database views**: VIEW для дашборда (агрегация прогресса за неделю)

---

## 10. Расширяемость

### 10.1 AI-рекомендации (будущее)

- Точка интеграции: `TrainingEngineService.generateProgram()` — заменить rule-based на AI
- Новый `RecommendationModule` — советы на основе анализа прогресса
- Данные прогресса уже структурированы для ML-фичей

### 10.2 Wearable-интеграции (будущее)

- Новый `IntegrationModule`
- Сервисы: `AppleHealthService`, `GarminService`, `FitbitService`
- Таблица `integrations` (user_id, provider, access_token, config)
- Маппинг внешних данных на `progress_logs` и `body_measurements`
- **VBT (Velocity-Based Training)**: сбор скорости штанги через смартфон/wearable → расширение прогрессии за пределы RIR (валидность измерения скорости штанги через смартфон-технологии подтверждена исследованиями)

### 10.3 Социальные функции (будущее)

- `SocialModule` — друзья, лента активности
- `ChallengeModule` — соревнования между пользователями
- `ChatModule` — чат тренер-клиент (WebSocket)
