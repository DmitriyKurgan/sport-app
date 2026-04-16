# FitTrack — План реализации

---

## Принципы работы

- Перед началом каждого этапа — сверяться с `architecture.md` И `sport-research.md`
- Все формулы (Mifflin–St Jeor, e1RM, протеин г/кг, диапазоны RIR/RPE, фазы 12-нед программы) — брать строго из `sport-research.md`
- После завершения этапа — обновить `context.md` (журнал изменений, статус модулей)
- Планирование и архитектурные решения — **Claude Opus 4.6**
- Написание кода по готовым инструкциям — **Claude Sonnet 4.6**

## Порядок этапов (обновлён под research)

```
0.  Инициализация (NestJS + Next.js + PostgreSQL)
1.  UserModule (auth)
2.  PreScreeningModule (PAR-Q+) ← НОВЫЙ
3.  ProfileModule (с lifestyle полями)
4.  BodyTypeModule (numeric scoring) ← НОВЫЙ
5.  AvatarModule (параметры) ← НОВЫЙ
6.  TrainingEngine (12-нед фазы + RIR autoreg + double progression)
7.  TrainingModule (с movement patterns)
8.  ProgressModule (RIR + session-RPE + e1RM + volume load)
9.  NutritionModule (3 тира + meal templates)
10. AnalyticsModule (e1RM, sRPE, weekly insights)
11. AlertsModule (плато/регресс/перетрен) ← НОВЫЙ
12. Frontend — каркас (store, ui, layout)
13. Frontend — страницы (с Avatar 3D)
14. Визуализация (Recharts: e1RM, volume load, internal load)
15. Фоновые задачи (Bull) — включая alert detectors
16. Redis-кэширование
17. Тесты и полировка
18. Docker и деплой
```

---

## Этап 0: Инициализация проекта

### 0.1 Backend (NestJS)

**Действия**:
1. Создать проект:
   ```bash
   nest new fittrack-api
   cd fittrack-api
   ```
2. Установить зависимости:
   ```bash
   npm install @nestjs/typeorm typeorm pg
   npm install @nestjs/passport passport passport-jwt
   npm install @nestjs/jwt
   npm install class-validator class-transformer
   npm install bcrypt
   npm install @nestjs/config
   npm install @nestjs/bull bull
   npm install ioredis
   npm install uuid
   npm install -D @types/passport-jwt @types/bcrypt
   ```
3. Настроить структуру папок:
   ```
   src/
   ├── common/
   │   ├── decorators/
   │   ├── filters/
   │   │   └── http-exception.filter.ts
   │   ├── interceptors/
   │   │   └── transform.interceptor.ts
   │   ├── pipes/
   │   │   └── validation.pipe.ts
   │   └── interfaces/
   │       └── paginated-response.interface.ts
   ├── config/
   │   ├── database.config.ts
   │   ├── jwt.config.ts
   │   └── redis.config.ts
   ├── modules/
   │   ├── user/
   │   ├── profile/
   │   ├── training/
   │   ├── training-engine/
   │   ├── nutrition/
   │   ├── progress/
   │   └── analytics/
   └── main.ts
   ```
4. Создать `.env`:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=fittrack
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   JWT_ACCESS_SECRET=...
   JWT_REFRESH_SECRET=...
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
5. Настроить `app.module.ts`:
   - ConfigModule (global, envFilePath)
   - TypeOrmModule.forRootAsync (из config)
   - Подключить ValidationPipe глобально
   - Подключить HttpExceptionFilter глобально
6. Настроить TypeORM:
   - `synchronize: false` (всегда миграции)
   - `entities: [__dirname + '/**/*.entity{.ts,.js}']`
   - `migrations: [__dirname + '/migrations/*{.ts,.js}']`

**Результат**: запускается `npm run start:dev`, подключается к PostgreSQL.

**Чеклист**:
- [ ] Проект создан
- [ ] Зависимости установлены
- [ ] Структура папок создана
- [ ] .env настроен
- [ ] AppModule настроен
- [ ] TypeORM подключается к БД
- [ ] Сервер запускается без ошибок

### 0.2 Frontend (Next.js)

**Действия**:
1. Создать проект:
   ```bash
   npx create-next-app@latest fittrack-web --typescript --tailwind --app --src-dir
   cd fittrack-web
   ```
2. Установить зависимости:
   ```bash
   npm install @reduxjs/toolkit react-redux
   npm install recharts
   npm install react-hook-form @hookform/resolvers zod
   npm install lucide-react
   npm install clsx tailwind-merge
   ```
3. Настроить структуру:
   ```
   src/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   ├── (auth)/
   │   └── (app)/
   ├── components/
   │   ├── ui/
   │   ├── layout/
   │   ├── auth/
   │   ├── onboarding/
   │   ├── dashboard/
   │   ├── training/
   │   ├── nutrition/
   │   ├── progress/
   │   └── charts/
   ├── store/
   │   ├── store.ts
   │   ├── provider.tsx
   │   ├── hooks.ts
   │   ├── api/
   │   └── slices/
   ├── lib/
   │   ├── utils.ts
   │   └── chart-transforms.ts
   └── types/
       ├── user.ts
       ├── profile.ts
       ├── training.ts
       ├── nutrition.ts
       ├── progress.ts
       └── analytics.ts
   ```
4. Настроить Redux Provider в `layout.tsx`
5. Создать `baseApi.ts` с `baseQueryWithReauth`
6. Настроить `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

**Результат**: запускается `npm run dev`, Redux стор работает.

**Чеклист**:
- [ ] Проект создан
- [ ] Зависимости установлены
- [ ] Структура папок создана
- [ ] Redux Provider настроен
- [ ] baseApi создан
- [ ] Сервер запускается

### 0.3 База данных

**Действия**:
1. Создать БД:
   ```sql
   CREATE DATABASE fittrack;
   ```
2. Создать первую миграцию со всеми таблицами (см. architecture.md, раздел 3.2):
   ```bash
   npm run typeorm migration:create src/migrations/InitialSchema
   ```
3. В миграции создать все таблицы в правильном порядке:
   - users
   - profiles
   - exercises
   - training_programs
   - training_weeks
   - training_days
   - training_day_exercises
   - progress_logs
   - body_measurements
   - nutrition_plans
   - meals
4. Добавить все индексы из architecture.md раздел 3.3
5. Запустить миграцию:
   ```bash
   npm run typeorm migration:run
   ```

**Чеклист**:
- [ ] БД создана
- [ ] Миграция написана
- [ ] Все таблицы созданы
- [ ] Все индексы созданы
- [ ] Миграция успешно выполнена

---

## Этап 1: UserModule (Аутентификация)

### 1.1 Entity

**Файл**: `src/modules/user/user.entity.ts`

Создать entity `User` со всеми полями из таблицы `users` (см. architecture.md 3.2).

TypeORM-декораторы:
- `@PrimaryGeneratedColumn('uuid')`
- `@Column()` для каждого поля с правильными типами
- `@CreateDateColumn()`, `@UpdateDateColumn()`
- `@DeleteDateColumn()` для soft delete
- `@OneToOne(() => Profile)` связь с профилем

**Чеклист**:
- [ ] Entity создан
- [ ] Все поля соответствуют таблице
- [ ] Связи настроены

### 1.2 DTOs

**Файлы**:
- `dto/create-user.dto.ts` — см. architecture.md 2.1
- `dto/login-user.dto.ts`
- `dto/update-user.dto.ts`
- `dto/user-response.dto.ts`

Использовать декораторы `class-validator` для валидации.

**Чеклист**:
- [ ] CreateUserDto с валидацией email, password, firstName, lastName
- [ ] LoginUserDto с валидацией email, password
- [ ] UpdateUserDto (partial)
- [ ] UserResponseDto (без password_hash)

### 1.3 Service

**Файл**: `src/modules/user/user.service.ts`

Реализовать все методы из architecture.md 2.1:
- `register()`: хэширование пароля (bcrypt, 10 rounds), сохранение, возврат без пароля
- `login()`: проверка пароля, генерация access + refresh токенов, сохранение хэша refresh
- `refreshTokens()`: проверка refresh token, генерация новой пары
- `logout()`: обнуление refresh_token_hash
- `findById()`: поиск по id
- `updateEmail()`: обновление email (проверка уникальности)
- `deleteAccount()`: soft delete (TypeORM `.softDelete()`)

JWT-конфигурация:
- Access token: 15 минут, подписан JWT_ACCESS_SECRET
- Refresh token: 7 дней, подписан JWT_REFRESH_SECRET
- Payload: `{ sub: userId, email }`

**Чеклист**:
- [ ] register — хэширование пароля, сохранение
- [ ] login — проверка пароля, генерация токенов
- [ ] refreshTokens — проверка и обновление
- [ ] logout — инвалидация refresh
- [ ] findById
- [ ] updateEmail
- [ ] deleteAccount (soft delete)
- [ ] Unit-тесты

### 1.4 Guards и Strategies

**Файлы**:
- `strategies/jwt.strategy.ts` — извлечение JWT из Bearer header, валидация
- `strategies/refresh-token.strategy.ts` — извлечение refresh token
- `guards/jwt-auth.guard.ts` — AuthGuard('jwt')
- `guards/refresh-token.guard.ts` — AuthGuard('jwt-refresh')
- `decorators/current-user.decorator.ts` — `@CurrentUser()` для получения user из request

**Чеклист**:
- [ ] JwtStrategy настроена
- [ ] RefreshTokenStrategy настроена
- [ ] Guards работают
- [ ] @CurrentUser декоратор возвращает пользователя

### 1.5 Controller

**Файл**: `src/modules/user/user.controller.ts`

Реализовать все эндпоинты из architecture.md 2.1 (таблица контроллера).

Каждый эндпоинт:
- Правильный HTTP-метод и путь
- Нужный Guard
- Использование @CurrentUser() где нужно
- Возврат правильного DTO

**Чеклист**:
- [ ] POST /auth/register
- [ ] POST /auth/login
- [ ] POST /auth/refresh
- [ ] POST /auth/logout
- [ ] GET /users/me
- [ ] PATCH /users/me
- [ ] DELETE /users/me
- [ ] e2e тесты

### 1.6 Module

**Файл**: `src/modules/user/user.module.ts`

- imports: TypeOrmModule.forFeature([User]), JwtModule, PassportModule
- providers: UserService, JwtStrategy, RefreshTokenStrategy
- controllers: UserController
- exports: UserService, JwtModule

**Обновить context.md**: UserModule → "Реализован"

---

## Этап 2: PreScreeningModule (PAR-Q+)

### 2.1 Константы

**Файл**: `src/modules/pre-screening/constants/parq-questions.ts`

Создать массив `PARQ_QUESTIONS` (см. architecture.md 2.7) — 8 канонических вопросов с полями:
- `id` — уникальный (heart_condition, chest_pain_activity, и т.д.)
- `text` — текст вопроса (на русском)
- `redFlagIfYes` — boolean
- `requiresClarification` — boolean (для pregnant)

**Чеклист**:
- [ ] PARQ_QUESTIONS массив создан
- [ ] Все 8 вопросов с правильными flag-настройками

### 2.2 Entity

**Файл**: `pre-screening.entity.ts`

Поля из таблицы `pre_screenings` (architecture.md 3.2):
- `id`, `userId`, `answers` (JSONB), `redFlags`, `redFlagReasons` (TEXT[]), `createdAt`

**Чеклист**:
- [ ] Entity создан
- [ ] @Column({ type: 'jsonb' }) для answers

### 2.3 DTOs

```typescript
// submit-screening.dto.ts
class SubmitScreeningDto {
  @IsObject()
  @ValidateNested()
  answers: Record<string, boolean>; // { question_id: yes/no }
}

// screening-result.dto.ts
class ScreeningResultDto {
  id: string;
  redFlags: boolean;
  redFlagReasons: string[];
  recommendation: string; // "Перед началом — проконсультируйтесь с врачом" если redFlags
  createdAt: Date;
}
```

**Чеклист**:
- [ ] SubmitScreeningDto
- [ ] ScreeningResultDto

### 2.4 Service

**PreScreeningService — методы** (architecture.md 2.7):

- `submit(userId, dto)`:
  1. Валидировать что все вопросы отвечены
  2. Вызвать `evaluateRedFlags(answers)`
  3. Сохранить запись
  4. Вернуть ScreeningResultDto
- `findLatest(userId)`: последний скрининг
- `evaluateRedFlags(answers)`: **чистая функция**:
  - Пройтись по PARQ_QUESTIONS
  - Для каждого вопроса: если `answers[q.id] === true && q.redFlagIfYes === true` → добавить в reasons
  - `redFlags = reasons.length > 0`

**Чеклист**:
- [ ] submit
- [ ] findLatest
- [ ] evaluateRedFlags (pure)
- [ ] Unit-тесты с разными комбинациями ответов

### 2.5 Controller

3 эндпоинта из architecture.md 2.7:
- POST `/api/v1/screening` (JwtAuthGuard)
- GET `/api/v1/screening/latest` (JwtAuthGuard)
- GET `/api/v1/screening/questions` (без guard — публично)

**Чеклист**:
- [ ] Все 3 эндпоинта
- [ ] e2e тест: submit → latest → проверка red flags

**Обновить context.md**: PreScreeningModule → "Реализован"

---

## Этап 3: ProfileModule

### 3.1 Enums

**Файлы** в `enums/` (см. architecture.md 2.2 — обновлённый список):
- `primary-training-goal.enum.ts` (strength/hypertrophy/fitness/endurance_mixed/sport_prep)
- `bodyweight-goal.enum.ts` (cut/maintain/bulk)
- `experience-level.enum.ts` (none/novice/intermediate)
- `gender.enum.ts`
- `session-duration.enum.ts` (30/45/60/75/90)
- `equipment-access.enum.ts` (bodyweight/home_dumbbells/gym/advanced_gym)
- `injury-flag.enum.ts` (shoulder/knee/hip/lower_back/neck/wrist/ankle/none)
- `technical-confidence.enum.ts` (low/medium/high)
- `stress-level.enum.ts` (low/medium/high)
- `daily-activity-level.enum.ts` (sedentary/moderate/active)
- `nutrition-tier.enum.ts` (budget/standard/advanced)
- `dietary-restriction.enum.ts`

**Чеклист**:
- [ ] Все 12 enum-ов созданы

### 3.2 Entity

**Файл**: `profile.entity.ts`

Все поля из таблицы `profiles` (architecture.md 3.2 — обновлённая схема):
- physicalProfile (5 полей + waistCm опц.)
- trainingExperience (4 поля + baseline strength опц.)
- goalDefinition (4 поля)
- constraintsAndLimitations (3 поля, включая `preScreeningRedFlags`)
- lifestyleFactors (5 полей)
- derived cached (bmi, ree, tdee, activityFactor)

**Чеклист**:
- [ ] Entity с 20+ полями
- [ ] TEXT[] для массивов (injuryPainFlags, dietaryRestrictions)
- [ ] @OneToOne с User

### 3.3 DTOs

- `create-profile.dto.ts` — полная валидация из architecture.md 2.2 (с @IsEnum, @Min, @Max, @ValidateNested)
- `baseline-strength.dto.ts` — опциональный под-DTO
- `update-profile.dto.ts` — PartialType(CreateProfileDto)
- `profile-response.dto.ts` — с derived (bmi, tdee, activityFactor, proteinTargetG, startingSplit)

**Чеклист**:
- [ ] CreateProfileDto (~20 полей с валидаторами из research)
- [ ] BaselineStrengthDto
- [ ] UpdateProfileDto
- [ ] ProfileResponseDto

### 3.4 Calculators (чистые функции в `calculators/`)

**Файл**: `calculators/bmi.calculator.ts`
```
bmi = weight / (height/100)^2
```

**Файл**: `calculators/ree.calculator.ts` (Mifflin–St Jeor):
```
male:   REE = 10*weight + 6.25*height - 5*age + 5
female: REE = 10*weight + 6.25*height - 5*age - 161
```

**Файл**: `calculators/tdee.calculator.ts`:
```
tdee = REE * activityFactor
```

**Файл**: `calculators/activity-factor.calculator.ts` (из architecture.md 2.2 — таблица):
```typescript
// (dailyActivityLevel, weeklyTrainingDaysTarget) → factor
const matrix = {
  sedentary: { low: 1.375, high: 1.55 },   // low = 2-3 дня, high = 4+
  moderate:  { low: 1.55, high: 1.725 },
  active:    { low: 1.725, high: 1.9 },
};
```

**Файл**: `calculators/protein-target.calculator.ts`:
```
default: weight * 1.6
cut + advanced tier: weight * 2.3 (до 3.1 по переносимости)
```

**Чеклист**:
- [ ] BMI calculator + test
- [ ] REE calculator (male + female) + test
- [ ] TDEE calculator + test
- [ ] Activity factor calculator + test
- [ ] Protein target calculator + test

### 3.5 Service

**ProfileService — методы**:
- `create(userId, dto)`:
  1. Проверить что профиля ещё нет
  2. Рассчитать все derived (BMI, REE, TDEE, activityFactor)
  3. Сохранить
  4. Вернуть ProfileResponseDto
- `findByUserId(userId)`
- `update(userId, dto)`: обновить + пересчитать derived + эмитить событие `profile.updated` (для BodyType/Avatar recalc)
- `calculateDerivedFields(profile)`: вызов всех calculator'ов

**Чеклист**:
- [ ] create с расчётом derived
- [ ] findByUserId
- [ ] update + event emit
- [ ] Unit-тесты

### 3.6 Controller

3 эндпоинта (POST/GET/PATCH `/api/v1/profile`), все под JwtAuthGuard.

**Чеклист**:
- [ ] Все эндпоинты
- [ ] e2e тесты

**Обновить context.md**: ProfileModule → "Реализован"

---

## Этап 4: BodyTypeModule (numeric scoring)

### 4.1 Интерфейсы

```typescript
// interfaces/body-scores.interface.ts
interface BodyScores {
  adiposity: number;    // z-score
  muscularity: number;
  linearity: number;
}

// interfaces/body-classification.interface.ts
interface BodyClassification {
  type: 'ectomorph' | 'mesomorph' | 'endomorph' | 'hybrid';
  confidence: 'low' | 'medium' | 'high';
  dominantComponents?: ('adiposity' | 'muscularity' | 'linearity')[];
}
```

### 4.2 Calculators

**adiposity-score.ts**:
```
score = z(BMI) [+ z(waistToHeight) если waistCm есть]
```
z-score относительно референсной популяции (константы: mean_BMI=24, sd_BMI=4).

**muscularity-score.ts**:
```
relativeStrengthIndex = max(e1RM_squat, e1RM_bench, e1RM_deadlift) / weightKg
score = z(relativeStrengthIndex)
если есть circumferences → + z(bicepsCm + chestCm)
```

**linearity-score.ts**:
```
heightToMassIndex = heightCm / weightKg^(1/3)
score = z(heightToMassIndex)
```

**classifier.ts**: правила из architecture.md 2.8, включая hybrid с top-2 components.

**Чеклист**:
- [ ] Все 3 calculator'а
- [ ] Classifier с hybrid логикой
- [ ] Unit-тесты: эктоморф кейс, мезоморф, эндоморф, 2-3 гибридных

### 4.3 Entity

`body_type_snapshots` (architecture.md 3.2): userId, 3 score, classification, dominantComponents, confidence, createdAt.

**Чеклист**:
- [ ] Entity с TEXT[] для dominantComponents

### 4.4 Service

- `recalculate(userId)`:
  1. Загрузить профиль + последние замеры + e1RM main_lifts
  2. Запустить все calculator'ы
  3. Классифицировать
  4. Сохранить новый snapshot
- `getCurrent(userId)`: последний snapshot
- `getHistory(userId)`: все snapshots для тренда

**Event listener**: на `profile.updated`, `measurement.added`, `progress.logged` → запускать `recalculate`.

**Чеклист**:
- [ ] recalculate
- [ ] getCurrent, getHistory
- [ ] Event listeners
- [ ] Unit-тесты

### 4.5 Controller

3 эндпоинта из architecture.md 2.8.

**Обновить context.md**: BodyTypeModule → "Реализован"

---

## Этап 5: AvatarModule

### 5.1 Entity

`avatar_snapshots` (architecture.md 3.2): все 9 параметров.

### 5.2 Service

**Маппинг профиль → параметры** (architecture.md 2.9 таблица):

```typescript
class AvatarService {
  recalculate(userId) {
    const profile = await profileService.findByUserId(userId);
    const measurements = await measurementService.findLatest(userId);
    const scoring = await bodyTypeService.getCurrent(userId);

    const params = {
      heightScale: profile.heightCm / 175,
      shoulderWidth: measurements?.chestCm
        ? mapToRange(measurements.chestCm, 85, 130)
        : profile.sex === 'male' ? 1.0 : 0.85,
      waistWidth: measurements?.waistCm
        ? mapToRange(measurements.waistCm, 60, 120)
        : deriveFromBMI(profile.bmi, scoring.adiposity),
      hipWidth: measurements?.hipsCm ? ... : 1.0,
      armGirth: measurements?.bicepsCm ? ... : 1.0,
      thighGirth: measurements?.thighCm ? ... : 1.0,
      chestDepth: derivedFromBmi(profile.bmi),
      muscleDefinition: 1 - normalizeToUnit(scoring.adiposity),
      bodyFatLayer: normalizeToUnit(scoring.adiposity),
    };

    // сохранить snapshot
  }

  getTransformation(userId, fromDate, toDate) {
    const from = await findNearest(userId, fromDate);
    const to = await findNearest(userId, toDate);
    // вернуть дельты по каждому параметру
  }
}
```

**Чеклист**:
- [ ] Entity
- [ ] AvatarService.recalculate
- [ ] getCurrent, getTransformation
- [ ] Event listener на body_type.recalculated
- [ ] Unit-тесты

### 5.3 Controller

GET `/api/v1/avatar`, GET `/api/v1/avatar/transformation`.

**Обновить context.md**: AvatarModule → "Реализован"

---

## Этап 6: TrainingEngine (ядро логики)

> Это самый важный модуль. Чистые функции, полное покрытие тестами.

### 6.1 Интерфейсы

**Файлы** в `interfaces/`:

```typescript
// program-config.interface.ts
interface ProfileConfig {
  sex: Gender;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  waistCm?: number;
  experienceLevel: ExperienceLevel;
  currentTrainingDaysPerWeek: number;
  technicalConfidence?: TechnicalConfidence;
  baselineStrength?: { squatKg?, benchKg?, deadliftKg?, pullUpsMaxReps? };
  primaryTrainingGoal: PrimaryTrainingGoal;
  bodyweightGoal: BodyweightGoal;
  weeklyTrainingDaysTarget: number;
  sessionDurationMinutes: 30|45|60|75|90;
  equipmentAccess: EquipmentAccess;
  injuryPainFlags: InjuryFlag[];
  preScreeningRedFlags: boolean;
  sleepHoursAvg: number;
  stressLevel: StressLevel;
  dailyActivityLevel: DailyActivityLevel;
}

// exercise-criteria.interface.ts
interface ExerciseCatalogItem {
  id: string;
  slug: string;
  name: string;
  movementPatterns: MovementPattern[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  jointInvolvement: JointInvolvement[];
  contraindications: InjuryFlag[];
  equipmentRequired: string[];
  equipmentAccessMin: EquipmentAccess;
  difficulty: 1|2|3|4|5;
  technicalDemand: 'low'|'medium'|'high';
  progressionChain?: string[];
  progressionOrder?: number;
}

// generated-program.interface.ts
interface GeneratedProgram {
  name: string;
  totalWeeks: 12;                         // фиксировано
  primaryGoal: PrimaryTrainingGoal;
  experienceLevel: ExperienceLevel;
  splitType: 'full_body'|'upper_lower'|'ppl'|'low_intensity';
  weeklyDays: number;
  isLowIntensityMode: boolean;            // если preScreeningRedFlags
  weeks: GeneratedWeek[];
}

interface GeneratedWeek {
  weekNumber: 1|2|...|12;
  phase: 'adaptation'|'accumulation'|'intensification'|'deload';
  mesocycleNumber: 1|2|3;
  intensityModifier: number;              // из PHASES map
  volumeModifier: number;
  isDeload: boolean;
  description: string;
  days: GeneratedDay[];
}

interface GeneratedDay {
  dayNumber: number;
  name: string;                           // "Full Body A" | "Upper" | "Push"
  splitTag: string;                       // "full_body_A" | "upper_a" | "push"
  targetPatterns: MovementPattern[];
  isRestDay: boolean;
  exercises: GeneratedExercise[];
}

interface GeneratedExercise {
  exerciseId: string;
  role: 'main_lift'|'accessory'|'finisher'|'warmup';
  orderIndex: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  targetRIR: number;                      // 1-3
  targetLoadKg?: number;                  // если baseline есть
  loadPctE1RM?: number;                   // если percent-based mode
  restSeconds: number;
  tempo?: string;
  notes?: string;
}
```

**Чеклист**:
- [ ] ProfileConfig
- [ ] ExerciseCatalogItem
- [ ] GeneratedProgram, GeneratedWeek, GeneratedDay, GeneratedExercise

### 6.2 Константы

**Файл** `constants/phases.ts` — 12-нед структура (architecture.md 4.4):

```typescript
export const PHASES = {
  1: { phase: 'adaptation', mesocycle: 1, intensityModifier: 0.75, volumeModifier: 0.85, description: 'Адаптация: техника' },
  2: { phase: 'adaptation', mesocycle: 1, intensityModifier: 0.80, volumeModifier: 0.95, description: 'Адаптация: рост объёма' },
  3: { phase: 'adaptation', mesocycle: 1, intensityModifier: 0.85, volumeModifier: 1.00, description: 'Адаптация: пик' },
  4: { phase: 'deload', mesocycle: 1, intensityModifier: 0.65, volumeModifier: 0.55, description: 'Разгрузка' },
  5: { phase: 'accumulation', mesocycle: 2, intensityModifier: 0.80, volumeModifier: 1.05, description: 'Накопление: объём' },
  6: { phase: 'accumulation', mesocycle: 2, intensityModifier: 0.82, volumeModifier: 1.10, description: 'Накопление' },
  7: { phase: 'accumulation', mesocycle: 2, intensityModifier: 0.85, volumeModifier: 1.15, description: 'Накопление: пик' },
  8: { phase: 'deload', mesocycle: 2, intensityModifier: 0.65, volumeModifier: 0.55, description: 'Разгрузка' },
  9: { phase: 'intensification', mesocycle: 3, intensityModifier: 0.90, volumeModifier: 0.90, description: 'Интенсификация' },
  10:{ phase: 'intensification', mesocycle: 3, intensityModifier: 0.93, volumeModifier: 0.85, description: 'Интенсификация' },
  11:{ phase: 'intensification', mesocycle: 3, intensityModifier: 0.95, volumeModifier: 0.80, description: 'Интенсификация: пик' },
  12:{ phase: 'deload', mesocycle: 3, intensityModifier: 0.60, volumeModifier: 0.50, description: 'Разгрузка + пересборка' },
};
```

**Файл** `constants/splits.ts` — sport-research weeklySplitsRules:

```typescript
export const SPLIT_RULES = {
  2: { type: 'full_body', days: ['full_body_A', 'full_body_B'], coverage: ['squat','hinge','push','pull','core'] },
  3: { type: 'full_body', days: ['full_body_A','full_body_B','full_body_C'], coverage: ['squat','hinge','push','pull','core'] },
  4: { type: 'upper_lower', days: ['upper_a','lower_a','upper_b','lower_b'] },
  5: { type: 'upper_lower_plus', days: ['upper_a','lower_a','upper_b','lower_b','full_body_accessories'] },
  6: { type: 'ppl', days: ['push_a','pull_a','legs_a','push_b','pull_b','legs_b'], recoveryGated: true },
};
```

**Файл** `constants/rep-ranges.ts` — параметры по цели (architecture.md 4.4 Step 5):

```typescript
export const REP_RANGES = {
  strength:        { sets: [3,5], repsMin: 3,  repsMax: 6,  targetRIR: [1,2], rest: 180 },
  hypertrophy:     { sets: [3,4], repsMin: 8,  repsMax: 12, targetRIR: [2,3], rest: 90 },
  fitness:         { sets: [2,3], repsMin: 10, repsMax: 15, targetRIR: [3,3], rest: 60 },
  endurance_mixed: { sets: [2,3], repsMin: 15, repsMax: 20, targetRIR: [3,3], rest: 45 },
  sport_prep:      { sets: [3,4], repsMin: 5,  repsMax: 8,  targetRIR: [2,2], rest: 120 },
};
```

**Файл** `constants/exercises-per-day.ts`:
```typescript
export const EXERCISES_PER_DAY = { 30:3, 45:4, 60:5, 75:6, 90:7 };
```

**Файл** `constants/progression-rates.ts`:
```typescript
export const PROGRESSION = {
  compoundIncrementKg: 2.5,
  isolationIncrementKg: 1.25,
  maxWeeklyIncreasePct: 10,
  failureReductionPct: 5,
  deloadVolumeReductionPct: 40,    // range 30-50
  deloadIntensityReductionPct: 7,  // range 5-10
  forcedDeloadRPEThreshold: 9.0,
  forcedDeloadStreak: 3,
  e1RMDropThresholdPct: 5,
};
```

**Файл** `constants/low-intensity-template.ts` — фиксированный шаблон для redFlags юзеров (bodyweight, 3 дня/нед, target_rir=4).

**Чеклист**:
- [ ] PHASES map 1-12
- [ ] SPLIT_RULES для 2-6 дней
- [ ] REP_RANGES для 5 целей
- [ ] EXERCISES_PER_DAY
- [ ] PROGRESSION константы
- [ ] LOW_INTENSITY_TEMPLATE

### 6.3 Генераторы

#### program-generator.ts

`generateProgram(profile, catalog) → GeneratedProgram`

Алгоритм (architecture.md 4.4):

```
Step 1: if profile.preScreeningRedFlags → return generateLowIntensityProgram(profile, LOW_INTENSITY_TEMPLATE)

Step 2: determine split
  daysTarget = min(profile.weeklyTrainingDaysTarget,
                   profile.experienceLevel === 'novice' ? 4 : 6)  // beginner cap
  splitRule = SPLIT_RULES[daysTarget]
  // для 6 дней: если sleep<7 или stress==='high' → fallback на 4 дня

Step 3: for weekNumber 1..12:
  phaseConfig = PHASES[weekNumber]
  week = generateWeek(weekNumber, phaseConfig, splitRule, profile, catalog, mainLiftsForMesocycle)
  weeks.push(week)
  // main_lifts выбираются один раз на мезоцикл (4 недели) и фиксируются

Step 4: return program с config_snapshot = profile
```

#### week-generator.ts

`generateWeek(weekNumber, phase, split, profile, catalog, mainLifts) → GeneratedWeek`

Для каждого дня сплита → `generateDay()` с применением `intensityModifier` и `volumeModifier` из фазы.

#### day-generator.ts

`generateDay(dayNumber, splitTag, targetPatterns, profile, catalog, phaseConfig, mainLifts) → GeneratedDay`

```
1. Определить patterns для дня по splitTag:
   - full_body_A: [squat, horizontal_push, horizontal_pull, core]
   - upper_a: [horizontal_push, horizontal_pull, vertical_pull, isolation]
   - push: [horizontal_push, vertical_push, isolation (triceps)]
   и т.д.

2. Для каждого pattern: подобрать упражнение через exercise-selector
   - pattern main_lift → использовать mainLifts[pattern] (фиксированный на мезоцикл)
   - accessories → ротация: выбрать другое упражнение каждые 1-2 недели

3. Ограничить количество упражнений до EXERCISES_PER_DAY[sessionDurationMinutes]

4. Параметры подходов:
   base = REP_RANGES[primaryTrainingGoal]
   sets = round(base.sets[random] * volumeModifier)
   targetRIR = base.targetRIR (для deload +1)

5. Lifestyle adjustments:
   if stressLevel==='high' || sleepHoursAvg<6:
     volumeModifier *= 0.9 (только для первых 2 недель)
     targetRIR += 1
   if dailyActivityLevel==='sedentary' && weekNumber===1:
     убрать accessories
```

#### exercise-selector.ts

`selectExercises(patterns, catalog, profile, role, exclude) → ExerciseCatalogItem[]`

```
1. Фильтр по equipment: exercise.equipmentAccessMin <= profile.equipmentAccess
2. Фильтр по травмам: intersection(exercise.contraindications, profile.injuryPainFlags) === []
3. Фильтр по exclude (уже выбранные, чтобы не дублировать)
4. Фильтр по difficulty:
   - novice → 1-2
   - intermediate → 2-4
5. Для role=main_lift:
   - приоритет compound movement patterns (squat/hinge/push/pull)
   - первый в progression_chain подходящий по уровню
6. Для role=accessory:
   - isolation или лёгкий compound
7. Coverage scoring: выбирать упражнения, которые покрывают максимум target patterns
8. Сортировка: main_lift первыми, accessories после
```

**Чеклист**:
- [ ] program-generator: 12 недель, 3 мезоцикла, стабильные main_lifts
- [ ] week-generator: применение phase modifiers
- [ ] day-generator: coverage patterns + lifestyle adjustments
- [ ] exercise-selector: фильтрация + coverage scoring + progression chain
- [ ] generateLowIntensityProgram: отдельная функция для redFlags
- [ ] Unit-тесты: 5+ сценариев (novice 3 дня, intermediate 4 дня, 6 дней + high stress=fallback, redFlags=low_intensity, sedentary week 1)
- [ ] Интеграционный тест: полный профиль → 12-нед программа с корректными фазами

### 6.4 Калькуляторы

#### progression-calculator.ts

**Double Progression (Mode A — RIR-based, default)**:

```typescript
function calculateProgression(
  currentWeekLogs: ProgressLog[],      // логи текущей недели по упражнению
  previousWeekPlan: DayExercise,        // план предыдущей недели
  history: ProgressLog[]                // 2-3 предыдущие недели для решения "2 раза подряд"
): ProgressionResult {

  // 1. Собрать факт по подходам
  const actualSets = currentWeekLogs.map(l => ({
    reps: l.reps,
    rir: l.rir,
    weight: l.weightKg,
  }));

  // 2. Оценить выполнение
  const allHitRepsMax = actualSets.every(s => s.reps >= previousWeekPlan.repsMax && s.rir <= previousWeekPlan.targetRir);
  const allInRange = actualSets.every(s => s.reps >= previousWeekPlan.repsMin);
  const failedRange = actualSets.filter(s => s.reps < previousWeekPlan.repsMin).length > actualSets.length / 2;

  // 3. Проверить "2 раза подряд" для повышения
  const previousWeekHit = checkPreviousWeekHit(history);

  // 4. Решение
  if (allHitRepsMax && previousWeekHit) {
    const increment = isCompound(previousWeekPlan.exerciseId)
      ? PROGRESSION.compoundIncrementKg
      : PROGRESSION.isolationIncrementKg;
    const newWeight = Math.min(
      previousWeekPlan.targetLoadKg + increment,
      previousWeekPlan.targetLoadKg * (1 + PROGRESSION.maxWeeklyIncreasePct / 100)
    );
    return { action: 'INCREASE_LOAD', newWeight, newRepsMin: previousWeekPlan.repsMin };
  }
  if (allInRange) {
    return { action: 'HOLD', newWeight: previousWeekPlan.targetLoadKg, targetRepsIncrement: 1 };
  }
  if (failedRange) {
    const newWeight = previousWeekPlan.targetLoadKg * (1 - PROGRESSION.failureReductionPct / 100);
    return { action: 'REGRESS', newWeight };
  }
  return { action: 'HOLD' };
}
```

#### deload-calculator.ts

```typescript
function shouldDeload(context: DeloadContext): { shouldDeload: boolean; reason: string } {
  // 1. Плановые делoad: неделя 4, 8, 12
  if ([4, 8, 12].includes(context.weekNumber))
    return { shouldDeload: true, reason: 'scheduled' };

  // 2. RIR avg < 1 три недели подряд (постоянно близко к отказу)
  if (context.avgRIRPerWeek.slice(-3).every(r => r < 1))
    return { shouldDeload: true, reason: 'rir_exhaustion' };

  // 3. session-RPE > 9 три недели
  if (context.avgSessionRPEPerWeek.slice(-3).every(r => r > PROGRESSION.forcedDeloadRPEThreshold))
    return { shouldDeload: true, reason: 'session_rpe_overload' };

  // 4. e1RM падает > 5% на 2 тренировках подряд
  if (detectE1RMDrop(context.e1rmHistory, PROGRESSION.e1RMDropThresholdPct))
    return { shouldDeload: true, reason: 'e1rm_regression' };

  return { shouldDeload: false, reason: '' };
}
```

#### volume-load-calculator.ts

```typescript
function calculateVolumeLoad(logs: ProgressLog[]): number {
  return logs.filter(l => !l.isWarmup)
             .reduce((sum, l) => sum + l.weightKg * l.reps, 0);
}
```

#### e1rm-calculator.ts

```typescript
// Формула Эпли
function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
```

#### internal-load-calculator.ts

```typescript
function calculateInternalLoad(sessionRPE: number, durationMinutes: number): number {
  return sessionRPE * durationMinutes;
}
```

**Чеклист**:
- [ ] progression-calculator (Mode A + Mode B) + unit-тесты всех веток
- [ ] deload-calculator: 4 причины + тесты
- [ ] volume-load-calculator
- [ ] e1rm-calculator (формула Эпли) + тест
- [ ] internal-load-calculator

### 6.5 TrainingEngineService

**Файл**: `training-engine.service.ts`

```typescript
class TrainingEngineService {
  generateProgram(profile, catalog): GeneratedProgram { ... }
  calculateProgression(currentWeekLogs, previousPlan, history): ProgressionResult { ... }
  shouldDeload(context): DeloadDecision { ... }
  generateLowIntensityProgram(profile): GeneratedProgram { ... }
  recalibrateFirstWeek(profile, week1Logs): RecalibrationResult { ... }
  // калибровка стартовых весов по неделе 1 через RIR
}
```

**Чеклист**:
- [ ] Service-фасад
- [ ] Все методы делегируют в генераторы/калькуляторы
- [ ] recalibrateFirstWeek реализован (если нет baseline_strength — неделя 1 как калибровка через RIR)
- [ ] Модуль экспортирует TrainingEngineService

**Обновить context.md**: TrainingEngine → "Реализован"

---

## Этап 7: TrainingModule

### 4.1 Entities

Создать 5 entities из architecture.md 3.2:
- `training-program.entity.ts` — с связями к User и TrainingWeek
- `training-week.entity.ts` — с связями к TrainingProgram и TrainingDay
- `training-day.entity.ts` — с связями к TrainingWeek и TrainingDayExercise
- `exercise.entity.ts` — каталог упражнений
- `training-day-exercise.entity.ts` — связь день-упражнение (M:N с параметрами)

**Чеклист**:
- [ ] TrainingProgram entity
- [ ] TrainingWeek entity
- [ ] TrainingDay entity
- [ ] Exercise entity
- [ ] TrainingDayExercise entity
- [ ] Все связи настроены

### 4.2 DTOs

- `generate-program.dto.ts` (опционально — можно без тела, берем из профиля)
- `program-response.dto.ts` — вложенная структура (программа → недели → дни → упражнения)
- `day-response.dto.ts`
- `exercise-response.dto.ts`
- `complete-exercise.dto.ts` — для записи подхода (weightKg, reps, rpe)

**Чеклист**:
- [ ] Все DTOs созданы

### 4.3 Services

**TrainingProgramService**:
- `generate(userId)`:
  1. Загрузить профиль (ProfileModule)
  2. Загрузить каталог упражнений
  3. Вызвать `TrainingEngine.generateProgram()`
  4. Деактивировать предыдущую активную программу
  5. Сохранить всю структуру (программа → недели → дни → упражнения) через транзакцию
  6. Вернуть сохраненную программу

**TrainingDayService**:
- `startDay()`: записать `started_at = NOW()`
- `completeDay()`: записать `completed_at = NOW()`

**ExerciseService**:
- `getExerciseCatalog(filters)`: фильтрация по muscleGroup, type, difficulty
- `completeExercise()`: делегирует в ProgressModule

**Чеклист**:
- [ ] TrainingProgramService.generate с транзакцией
- [ ] TrainingProgramService.findActive, findAll, findById
- [ ] TrainingDayService.startDay, completeDay
- [ ] ExerciseService.getExerciseCatalog
- [ ] Unit-тесты
- [ ] e2e: профиль → генерация → получение программы

### 7.4 Seed: каталог упражнений

Создать seed-миграцию с 40-60 упражнениями. Каждое с:
- `slug` (snake_case уникальный)
- `movementPatterns[]` (минимум 1)
- `primaryMuscles[]`, `secondaryMuscles[]`
- `jointInvolvement[]`
- `contraindications[]` (если болит X — нельзя)
- `equipmentRequired[]`, `equipmentAccessMin`
- `difficulty` (1-5)
- `technicalDemand`
- `progressionChain`, `progressionOrder` (для связанных упражнений)

**Покрытие по паттернам (минимум каждого)**:

| Pattern | Обязательные упражнения | Cnt |
|---------|-------------------------|-----|
| squat | bodyweight_squat, goblet_squat, front_squat, back_squat, bulgarian_split_squat, leg_press | 6 |
| hinge | hip_thrust, rdl, deadlift, kettlebell_swing, good_morning | 5 |
| horizontal_push | knee_pushup, pushup, bench_press, dumbbell_bench, chest_press_machine | 5 |
| horizontal_pull | bent_over_row, dumbbell_row, cable_row, inverted_row | 4 |
| vertical_push | dumbbell_shoulder_press, overhead_press, seated_press | 3 |
| vertical_pull | assisted_pullup, pullup, lat_pulldown, chin_up | 4 |
| lunge | forward_lunge, reverse_lunge, walking_lunge | 3 |
| core | plank, dead_bug, pallof_press, hanging_leg_raise, ab_wheel | 5 |
| carry | farmer_carry, suitcase_carry | 2 |
| isolation | biceps_curl, triceps_extension, lateral_raise, face_pull, leg_extension, leg_curl, calf_raise | 7+ |

**Progression chains** (важны для beginner → intermediate):
- push: `knee_pushup → pushup → bench_press → barbell_bench`
- squat: `bodyweight_squat → goblet_squat → front_squat → back_squat`
- pull: `inverted_row → assisted_pullup → pullup → weighted_pullup`

**Чеклист**:
- [ ] Seed-миграция
- [ ] 40-60 упражнений покрывают все patterns
- [ ] Progression chains прописаны
- [ ] Все contraindications корректны (shoulder для OHP, lower_back для deadlift с проблемами и т.п.)
- [ ] Минимум 1 упражнение для bodyweight-only пользователей на каждый pattern

### 4.5 Controllers

Все эндпоинты из architecture.md 2.3 (таблица контроллера). Все под JwtAuthGuard.

**Чеклист**:
- [ ] Все 10 эндпоинтов реализованы
- [ ] e2e тесты

**Обновить context.md**: TrainingModule → "Реализован"

---

## Этап 8: ProgressModule

### 8.1 Entities

- `progress-log.entity.ts` — с полями rir, rpe, estimated_1rm, volume_load (architecture.md 3.2)
- `session-rpe-log.entity.ts` — новая сущность (architecture.md 3.2)
- `body-measurement.entity.ts`

**Чеклист**:
- [ ] ProgressLog entity (включая rir, e1RM, volume_load)
- [ ] SessionRPELog entity
- [ ] BodyMeasurement entity

### 8.2 DTOs

- `create-progress-log.dto.ts` — с **RIR (приоритет) + RPE (альт.)** из architecture.md 2.5
- `log-session-rpe.dto.ts` — sessionRPE + durationMinutes
- `create-body-measurement.dto.ts`
- Response DTOs

**Чеклист**:
- [ ] CreateProgressLogDto с валидацией RIR (0-5) и RPE (1-10)
- [ ] LogSessionRPEDto
- [ ] CreateBodyMeasurementDto

### 8.3 ProgressLogService — методы

- `logSet(userId, dto)`:
  1. Валидация (exerciseId, trainingDayId, dayExerciseId принадлежат юзеру)
  2. Рассчитать `estimated_1rm = calculateE1RM(weight, reps)`
  3. Рассчитать `volume_load = weight * reps` (если не warmup)
  4. Сохранить
  5. Эмитить событие `progress.logged` → AlertsModule listeners
- `logSessionRPE(userId, dto)`:
  1. Рассчитать `internal_load = sessionRPE * durationMinutes`
  2. Сохранить
  3. Эмитить `session.rpe.logged`
- `getByDateRange(userId, from, to)`: с пагинацией
- `getByExercise(userId, exerciseId)`: история + e1RM trend для графика
- `getPersonalRecords(userId)`:
  ```sql
  SELECT exercise_id, MAX(weight_kg) as pr_weight, MAX(estimated_1rm) as pr_e1rm
  FROM progress_logs
  WHERE user_id = $1 AND is_warmup = false
  GROUP BY exercise_id
  ```
- `getVolumeLoadByWeek(userId)`:
  ```sql
  SELECT DATE_TRUNC('week', performed_at) as week, SUM(volume_load)
  FROM progress_logs WHERE user_id = $1 AND is_warmup = false
  GROUP BY week ORDER BY week
  ```
- `getInternalLoadByWeek(userId)`: аналогично, по session_rpe_logs
- `getAvgRIRMainLifts(userId, weekStart)`: AVG(rir) WHERE exercise_id IN (main_lifts текущего мезоцикла)

**Чеклист**:
- [ ] logSet с расчётом e1RM и volume_load + emit event
- [ ] logSessionRPE с расчётом internal_load
- [ ] getByDateRange с пагинацией
- [ ] getByExercise с e1RM timeline
- [ ] getPersonalRecords (SQL агрегация)
- [ ] getVolumeLoadByWeek, getInternalLoadByWeek
- [ ] getAvgRIRMainLifts
- [ ] Unit-тесты

### 8.4 BodyMeasurementService

- CRUD + `getHistory(metric)` + **rolling average** для веса:
  ```typescript
  getWeightTrend(userId, days = 30): { date, weightKg, avg7d, avg14d }[]
  ```

**Чеклист**:
- [ ] BodyMeasurement CRUD
- [ ] getWeightTrend с 7/14-day rolling average
- [ ] Unit-тесты

### 8.5 Controllers

Все эндпоинты из architecture.md 2.5 + новые:
- POST `/api/v1/progress/log` (подход)
- POST `/api/v1/progress/session-rpe` (session-RPE)
- GET `/api/v1/progress/logs`
- GET `/api/v1/progress/records`
- GET `/api/v1/progress/volume-load` (для Analytics)
- GET `/api/v1/progress/internal-load`
- POST /GET `/api/v1/progress/measurements`
- GET `/api/v1/progress/measurements/weight-trend`

**Чеклист**:
- [ ] Все 8+ эндпоинтов
- [ ] e2e тесты

**Обновить context.md**: ProgressModule → "Реализован"

---

## Этап 9: NutritionModule (3 тира)

### 9.1 Entities

- `nutrition-plan.entity.ts` — с полями tier, bodyweightGoal, currentPhase, supplements (JSONB) (architecture.md 3.2)
- `meal-template.entity.ts` — общий каталог шаблонов
- `nutrition-plan-meal.entity.ts` — M:N связь плана и шаблонов

**Чеклист**:
- [ ] NutritionPlan с новыми полями
- [ ] MealTemplate
- [ ] NutritionPlanMeal (junction)

### 9.2 Calculators (чистые функции)

**Файл** `calculators/calories.calculator.ts`:

```typescript
function calculateCalorieTarget(profile, tdee, phase): number {
  let baseTarget = tdee;

  switch (profile.bodyweightGoal) {
    case 'cut':
      baseTarget = tdee - 300; // default
      // safeguard: max −600 ккал (темп 0.5-1 кг/нед)
      baseTarget = Math.max(baseTarget, tdee - 600);
      break;
    case 'bulk':
      baseTarget = tdee + 150; // малый профицит
      break;
  }

  // Корректировка по фазе:
  if (phase === 'accumulation') baseTarget *= 1.05;
  if (phase === 'deload' && profile.bodyweightGoal !== 'bulk') baseTarget *= 0.95;

  return Math.round(baseTarget);
}
```

**Файл** `calculators/macros.calculator.ts`:

```typescript
function calculateMacros(profile, calories, tier, phase): Macros {
  // Белок
  let proteinGPerKg = 1.6; // default
  if (profile.bodyweightGoal === 'cut' && tier === 'advanced')
    proteinGPerKg = 2.3;
  const proteinG = profile.weightKg * proteinGPerKg;

  // Жиры: 25% энергии
  const fatG = (calories * 0.25) / 9;

  // Углеводы: остаток
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsG = (calories - proteinKcal - fatKcal) / 4;

  // Проверка: carbsG / weightKg должно попасть в 3-12 г/кг (athlete framework)
  const carbsGPerKg = carbsG / profile.weightKg;
  // если < 3 — увеличить жиры, уменьшить белок (в допустимых границах)

  return {
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
    proteinPerMealG: Math.round(profile.weightKg * 0.25), // 0.25 г/кг на приём
  };
}
```

**Чеклист**:
- [ ] calories-calculator с safeguards
- [ ] macros-calculator с проверкой границ
- [ ] Unit-тесты: 3 сценария (cut/maintain/bulk) × 3 тира × 4 фазы

### 9.3 Service

**NutritionService**:
- `generatePlan(userId)`:
  1. Загрузить профиль + текущую фазу программы
  2. `calories = calculateCalorieTarget(profile, profile.tdee, phase)`
  3. `macros = calculateMacros(profile, calories, profile.nutritionTierPreference, phase)`
  4. `supplements = tier === 'advanced' ? [{ name: 'creatine_monohydrate', dose: '3-5 g/day', ...}] : []`
  5. Деактивировать старый план, сохранить новый
  6. Выбрать meal templates: `selectMealTemplates(tier, dietaryRestrictions, calories, proteinG)`
  7. Создать `nutrition_plan_meals` записи
- `recalibrate(userId)`:
  1. Получить 14-дневный weight trend
  2. Если cut и вес не меняется → −100 ккал (с safeguards)
  3. Если bulk и вес не меняется → +100 ккал
  4. Обновить план

**Выбор шаблонов меню** (`selectMealTemplates`):
- Фильтр: `tier === profile.nutritionTierPreference`
- Фильтр: `dietary_tags` совместимы с `profile.dietaryRestrictions`
- Алгоритм: выбрать комбинацию шаблонов, суммарно достигающую целевых калорий ±5% и белка ±10%
- Для advanced: добавить pre_workout + post_workout шаблоны

**Чеклист**:
- [ ] generatePlan с использованием фазы
- [ ] recalibrate по 14-day trend
- [ ] selectMealTemplates с tier + dietary фильтрами
- [ ] Event listener на `program.week.changed` → пересчёт плана с новой фазой
- [ ] Unit-тесты

### 9.4 Seed: meal templates

~30-50 шаблонов по тирам:

| Тир | Примеры | Cnt |
|-----|---------|-----|
| budget | Овсянка+молоко+банан / Рис+курица+замор.овощи / Гречка+яйца / Творог+ягоды | 10-15 |
| standard | Омлет+овсянка / Картофель+рыба+салат / Йогурт+орехи / Куриный салат | 10-15 |
| advanced | Pre-workout: бананы+рис+курица; Post-workout: белок+банан+молоко | 10-15 |

Каждый с `calories`, `protein_g`, `fat_g`, `carbs_g`, `ingredients` (JSONB), `dietary_tags`.

**Чеклист**:
- [ ] Seed с 30+ шаблонами
- [ ] Покрытие всех тиров
- [ ] Вегетарианские/веганские опции

### 9.5 Controller

- POST `/api/v1/nutrition/generate`
- POST `/api/v1/nutrition/recalibrate`
- GET `/api/v1/nutrition/plan`
- PATCH `/api/v1/nutrition/plan/:id` (смена тира)
- GET `/api/v1/nutrition/plan/:id/meals?dayType=training_day`

**Обновить context.md**: NutritionModule → "Реализован"

---

## Этап 10: AnalyticsModule

### 10.1 Service

**AnalyticsService** — все методы из architecture.md 2.6 (обновлённые):

- `getDashboard(userId)`:
  1. Текущая программа + week/phase
  2. completedDays / plannedDays
  3. Рекорды за 30 дней (maxWeight + e1RM)
  4. BodyWeight trend (7/14-day rolling avg)
  5. VolumeLoad за 4 недели
  6. InternalLoad (session-RPE) за 4 недели
  7. avgRIR по main_lifts текущей недели
  8. consistencyScore
  9. Собрать DashboardResponse

- `getExerciseProgress(userId, exerciseId, period)`:
  - GROUP BY week → maxWeight, bestSet, e1RM

- `getVolumeLoadAnalytics(userId, period)`: delegates to ProgressLogService.getVolumeLoadByWeek

- `getInternalLoadAnalytics(userId, period)`: delegates to ProgressLogService.getInternalLoadByWeek

- `getBodyComposition(userId, period)`: замеры → ChartDataPoint[]

- `getConsistencyScore(userId)`: `completedDays / plannedDays * 100`

- `getWeeklyReport(userId)`: генерация 2-3 UX-инсайтов:
  1. **Что улучшилось**: e1RM вырос / PR побит / вес в цели
  2. **Что тормозит**: плато / перегруз (по RIR trend) / низкий adherence
  3. **Что делать**: рекомендация (делoad / прибавка / пересборка)

**Чеклист**:
- [ ] getDashboard
- [ ] getExerciseProgress с e1RM
- [ ] getVolumeLoadAnalytics, getInternalLoadAnalytics
- [ ] getBodyComposition
- [ ] getConsistencyScore
- [ ] getWeeklyReport с генерацией 3 инсайтов
- [ ] Контроллер с 6 эндпоинтами (architecture.md 2.6)
- [ ] Unit-тесты

**Обновить context.md**: AnalyticsModule → "Реализован"

---

## Этап 11: AlertsModule

### 11.1 Entity

`alert.entity.ts` из architecture.md 3.2:
- id, userId, type, severity, title, message, recommendation
- context (JSONB с контекстными данными)
- triggeredAt, dismissedAt, actedUpon, actedAt

**Чеклист**:
- [ ] Alert entity с JSONB context

### 11.2 Detectors (чистые функции)

#### plateau-strength.detector.ts

```typescript
function detectStrengthPlateau(
  e1rmHistory: { week, e1rm, exercise_id }[],
  adherencePct: number
): Alert | null {
  if (adherencePct < 80) return null; // плато при плохом adherence — это просто пропуски
  // Для каждого main_lift: если e1RM за последние 2-3 нед не растёт (вариация < 1%) → alert
  for (const exerciseId of mainLifts) {
    const recent = e1rmHistory.filter(h => h.exercise_id === exerciseId).slice(-3);
    if (recent.length >= 2 && maxVariation(recent) < 0.01) {
      return {
        type: 'plateau_strength',
        severity: 'warning',
        title: 'Плато по силе',
        message: `${exerciseName} не растёт ${recent.length} недели`,
        recommendation: 'Рекомендуем уменьшить объём на 1 микроцикл или сделать внеплановый делoad',
        context: { exerciseId, weeks: recent.length, currentE1RM: recent[recent.length-1].e1rm },
      };
    }
  }
  return null;
}
```

#### regression.detector.ts

```typescript
function detectRegression(recentSessions, sessionRPETrend): Alert | null {
  // Падение e1RM/volume > 5-8% на 2 тренировках подряд
  // + рост session-RPE
  if (calcE1RMDrop(recentSessions) > 5 && isIncreasing(sessionRPETrend)) {
    return {
      type: 'regression',
      severity: 'critical',
      title: 'Регресс показателей',
      message: 'Падение показателей + растёт субъективная тяжесть',
      recommendation: 'Рекомендуем Recovery-неделю (делoad)',
    };
  }
  return null;
}
```

#### weight-plateau-cut.detector.ts

```typescript
function detectWeightPlateauCut(profile, weightTrend): Alert | null {
  if (profile.bodyweightGoal !== 'cut') return null;
  // 14-day rolling avg не меняется (< 0.2 кг)
  const last14 = weightTrend.slice(-14);
  if (Math.abs(last14[0].avg14d - last14[13].avg14d) < 0.2) {
    return {
      type: 'weight_plateau_cut',
      severity: 'info',
      title: 'Плато веса на cut',
      message: 'Вес не меняется 2 недели',
      recommendation: '−100 ккал/день ИЛИ +1500 шагов/день (в пределах безопасного темпа)',
    };
  }
  return null;
}
```

#### overtraining.detector.ts

```typescript
function detectOvertraining(sessionRPEWeekly, profile): Alert | null {
  const last3 = sessionRPEWeekly.slice(-3);
  if (last3.every(w => w.avgSessionRPE > 8) && profile.sleepHoursAvg < 6) {
    return {
      type: 'overtraining',
      severity: 'critical',
      title: 'Риск перетренированности',
      message: 'High RPE 3 недели подряд + недостаточный сон',
      recommendation: 'Принудительный делoad на следующую неделю',
    };
  }
  return null;
}
```

**Чеклист**:
- [ ] plateau-strength.detector + test
- [ ] regression.detector + test
- [ ] weight-plateau-cut.detector + test
- [ ] overtraining.detector + test

### 11.3 AlertsService

- `runAllDetectors(userId)`:
  1. Собрать контекст: e1RM history, weight trend, session-RPE weekly, adherence
  2. Запустить все detectors
  3. Сохранить новые алерты (дедупликация: не создавать если такой же type активен)
- `getActive(userId)`: `WHERE dismissed_at IS NULL`
- `dismiss(alertId, userId)`: проставить dismissed_at
- `actOn(alertId, userId)`:
  1. Проставить actedUpon = true
  2. Если type = plateau_strength / overtraining / regression → запустить принудительный делoad на след. неделю (сотрудничество с TrainingModule)
  3. Если weight_plateau_cut → NutritionService.recalibrate

**Чеклист**:
- [ ] runAllDetectors (orchestrator)
- [ ] getActive, dismiss, actOn
- [ ] actOn выполняет реальные действия (trigger deload, trigger recalibrate)
- [ ] Bull job: `run-alert-detectors` (ежедневно + после событий)
- [ ] Event listeners: `progress.logged`, `session.rpe.logged`

### 11.4 Controller

- GET `/api/v1/alerts`
- POST `/api/v1/alerts/:id/dismiss`
- POST `/api/v1/alerts/:id/act`

**Обновить context.md**: AlertsModule → "Реализован"

---

## Этап 12: Frontend — базовый каркас

### 8.1 Типы

**Папка** `src/types/` — TypeScript интерфейсы, соответствующие API response DTOs:

- `user.ts`: User, LoginRequest, RegisterRequest, AuthResponse
- `profile.ts`: Profile, CreateProfileRequest, ProfileResponse
- `training.ts`: Program, Week, Day, Exercise, DayExercise, CompleteExerciseRequest
- `nutrition.ts`: NutritionPlan, Meal
- `progress.ts`: ProgressLog, BodyMeasurement, PersonalRecord, CreateProgressLogRequest
- `analytics.ts`: DashboardResponse, ChartDataPoint, AnalyticsPeriod

**Чеклист**:
- [ ] Все типы созданы и соответствуют API

### 8.2 Redux Store

1. `store/store.ts` — configureStore с baseApi.reducer и middleware
2. `store/provider.tsx` — ReduxProvider обертка
3. `store/hooks.ts` — типизированные useAppSelector, useAppDispatch
4. `store/slices/authSlice.ts` — accessToken, user, login/logout actions
5. `store/slices/uiSlice.ts` — sidebarOpen, activeModal

**Чеклист**:
- [ ] Store настроен
- [ ] Provider подключен в layout.tsx
- [ ] authSlice работает

### 12.3 API Slices

Реализовать все API slices из architecture.md 7 (обновлённый список):

- `baseApi.ts` с reauth + tagTypes:
  `['Profile', 'Screening', 'BodyType', 'Avatar', 'Program', 'TrainingDay',
    'Progress', 'SessionRPE', 'Measurements', 'Analytics', 'Nutrition',
    'Alerts', 'MealTemplate']`
- `authApi.ts`
- `profileApi.ts`
- `screeningApi.ts` — submit, getLatest, getQuestions
- `bodyTypeApi.ts` — getCurrent, getHistory, recalculate
- `avatarApi.ts` — getCurrent, getTransformation
- `trainingApi.ts` — generate, getActive, getDay, startDay, completeDay, completeExercise, getCatalog
- `progressApi.ts` — logSet, logSessionRPE, getLogs, getRecords, getMeasurements, getWeightTrend
- `analyticsApi.ts` — getDashboard, getExerciseProgress, getVolumeLoad, getInternalLoad, getBody, getWeeklyReport
- `nutritionApi.ts` — generatePlan, recalibrate, getPlan, updatePlan, getMeals
- `alertsApi.ts` — getActive, dismiss, act

**Чеклист**:
- [ ] baseApi с reauth + 13 tagTypes
- [ ] Все 11 API slices
- [ ] Правильная инвалидация согласно architecture.md 7.4 (каждое событие — набор тегов)

### 8.4 UI-компоненты (базовые)

Создать базовые переиспользуемые компоненты в `components/ui/`:
- Button (primary, secondary, danger, ghost, loading state)
- Input (с label, error, helper text)
- Card (с header, body, footer)
- Modal (с overlay, close)
- Badge (статусы: success, warning, error, info)
- Skeleton (для loading states)
- Spinner
- Toast (success, error — через context/portal)

**Чеклист**:
- [ ] Все 8 UI-компонентов
- [ ] Tailwind стилизация
- [ ] Responsive

### 8.5 Layout

- `components/layout/Navbar.tsx` — лого, навигация, профиль
- `components/layout/Sidebar.tsx` — desktop навигация
- `components/layout/MobileNav.tsx` — bottom navigation для мобильных
- `app/(app)/layout.tsx` — protected layout с navbar + sidebar

**Чеклист**:
- [ ] Navbar
- [ ] Sidebar с активными ссылками
- [ ] MobileNav
- [ ] Protected layout (редирект если нет токена)
- [ ] Responsive: sidebar на desktop, bottom nav на mobile

---

## Этап 13: Frontend — страницы

### 13.1 Auth страницы

- `(auth)/login/page.tsx` — форма логина (react-hook-form + zod)
- `(auth)/register/page.tsx` — форма регистрации
- Используют `authApi.useLoginMutation()` и т.д.
- После успеха: сохранить токен в authSlice, редирект на dashboard

**Чеклист**:
- [ ] Login page
- [ ] Register page
- [ ] Валидация форм
- [ ] Обработка ошибок
- [ ] Редирект после успеха

### 13.2 Onboarding (9 шагов)

- `(app)/onboarding/page.tsx` — визард с 9 шагами (architecture.md 6.3):
  1. **PreScreening** — StepPreScreening с PAR-Q+ вопросами. При redFlags: показать модалку-предупреждение с рекомендацией консультации и баннер в профиле.
  2. **PersonalInfo** — sex, age
  3. **BodyMetrics** — height, weight, waist (опц.)
  4. **Experience** — experience_level, current_days, technical_confidence
  5. **Goals** — primary_training_goal, bodyweight_goal, weekly_days_target, session_duration
  6. **Equipment** — equipment_access (radio: bodyweight/home_dumbbells/gym/advanced_gym), injury_pain_flags (multi-check)
  7. **Lifestyle** — sleep_hours (slider 3-12), stress (low/med/high), daily_activity, nutrition_tier, dietary_restrictions
  8. **BaselineStrength** — опционально (squat/bench/dl/pullups)
  9. **Summary** — derived fields (BMI, TDEE, protein target), body type preview (scoring), какая будет программа (12 нед, split, phases timeline)

- Локальное состояние через `useState` (без Redux для шагов) + zod-схемы на каждый шаг
- Прогресс-бар сверху
- Навигация: "Назад" / "Далее" / "Пропустить" (для опц. шагов) / "Завершить"

**На submit (Summary → "Начать"):**
1. `screeningApi.submit(answers)` — отправить PAR-Q+
2. `profileApi.createProfile({ ...fields, preScreeningRedFlags })` — создать профиль
3. `trainingApi.generateProgram()` — программа
4. `nutritionApi.generatePlan()` — питание
5. `bodyTypeApi.recalculate()` — scoring
6. Редирект на `/dashboard`

**Чеклист**:
- [ ] 9 шагов с валидацией zod
- [ ] PreScreening с правильной обработкой redFlags (модалка + пометка профиля)
- [ ] Прогресс-бар
- [ ] Summary с derived fields
- [ ] Orchestration 5 API-вызовов на submit
- [ ] Обработка ошибок на каждом вызове
- [ ] Редирект на dashboard

### 13.3 Dashboard

- `(app)/dashboard/page.tsx`
- Данные из `analyticsApi.useGetDashboardQuery()` + `alertsApi.useGetActiveAlertsQuery()`
- Компоненты (architecture.md 6.2):
  - **AlertBanner** — если есть critical алерт (plateau/regression/overtraining) — баннер сверху с recommendation + кнопкой "Применить"
  - **DashboardStats** — 4 карточки: текущая фаза + неделя (2/12), consistency %, body weight (с delta за 7 дней), avg RIR main lifts
  - **WeekProgress** — прогресс-бар недели
  - **PhaseIndicator** — визуализация 12 недель с подсветкой текущей фазы
  - **UpcomingWorkout** — следующая тренировка + кнопка "Начать"
  - **RecentRecords** — PR cards (с e1RM)
  - **WeeklyInsights** — 2-3 карточки с инсайтами из getWeeklyReport ("Что улучшилось / тормозит / делать")
  - **QuickActions**

**Чеклист**:
- [ ] Dashboard с AlertBanner
- [ ] DashboardStats с avgRIR
- [ ] PhaseIndicator 12-недельный
- [ ] WeeklyInsights с 3 инсайтами из API
- [ ] Loading/Error states

### 13.4 Training

#### Обзор программы (`/training`)
- Активная 12-нед программа
- **PhaseIndicator** — визуализация фаз (adaptation 1-3, deload 4, accumulation 5-7, deload 8, intensification 9-11, deload 12)
- WeekView: список дней текущей недели + status
- Можно кликнуть на неделю вперёд/назад

#### День тренировки (`/training/day/[dayId]`)

**ExerciseCard** для каждого упражнения:
- Название + role badge (main_lift / accessory)
- Плановые параметры: "4×8-12 @ RIR 2, отдых 90с"
- Список подходов (ExerciseSetRow), для каждого:
  - Weight input
  - Reps input
  - **RIRPicker** (0-5) с текстом: "0 = до отказа", "2 = ещё 2 повтора в запасе"
  - Либо переключатель на RPE в настройках (uiSlice.rirPreference === 'rpe')
  - Чекбокс "warmup"
  - Кнопка "Записать подход" → `progressApi.logSet()`
- **PrevResultBadge** — результат за прошлый раз (для сравнения)

**WorkoutTimer** — после каждого подхода: countdown от `rest_seconds`.

**Завершение тренировки**:
1. Кнопка "Завершить" → показать **SessionRPEPrompt** модалку
2. "Оцени общую тяжесть тренировки (1-10)" + показать длительность (автоподсчёт)
3. Submit → `progressApi.logSessionRPE()` → `trainingApi.completeDay()`
4. **WorkoutComplete** экран:
   - Total volume load за тренировку
   - Новые e1RM (если побиты)
   - Сравнение с прошлой тренировкой
   - Кнопка "На дашборд"

**Чеклист**:
- [ ] Program overview с PhaseIndicator
- [ ] Training day page
- [ ] ExerciseCard + ExerciseSetRow + RIRPicker
- [ ] WorkoutTimer (берёт rest_seconds из плана)
- [ ] PrevResultBadge (последний результат по этому упражнению)
- [ ] SessionRPEPrompt (модалка в конце)
- [ ] WorkoutComplete с volume load и e1RM updates
- [ ] Правильная orchestration: logSet → logSessionRPE → completeDay

### 13.5 Nutrition

- `(app)/nutrition/page.tsx`
- NutritionOverview: tier badge, калории + БЖУ (MacrosChart PieChart), protein per meal hint
- Переключатель day type: training_day / rest_day / heavy_training_day
- Список приёмов пищи из `nutrition_plan_meals` с учётом day type
- Для advanced тира: supplements секция (креатин, дозировка)
- `(app)/nutrition/tier/page.tsx` — смена тира (budget/standard/advanced) с предпросмотром меню

**Чеклист**:
- [ ] Nutrition page с tier + day type switcher
- [ ] MacrosPieChart
- [ ] MealCards (разные для training_day vs rest_day)
- [ ] Supplements для advanced
- [ ] Tier change page

### 13.6 Progress

- `(app)/progress/page.tsx`:
  - BodyMeasurementForm
  - **WeightChart** с rolling avg (7d, 14d) — линии на одном графике
  - BodyCompositionChart (обхваты)
  - История замеров (таблица)
- `(app)/progress/records/page.tsx`:
  - PersonalRecordCards (с e1RM)
  - **E1RMChart** — по main_lifts текущей программы
  - **VolumeLoadChart** — по неделям
  - **InternalLoadChart** — session-RPE * duration по неделям
  - **AvgRIRChart** — средний RIR по main_lifts (индикатор перегруза)

**Чеклист**:
- [ ] Progress page
- [ ] BodyMeasurementForm
- [ ] WeightChart с rolling avg 7/14
- [ ] BodyCompositionChart
- [ ] Records page с e1RM
- [ ] E1RMChart, VolumeLoadChart, InternalLoadChart, AvgRIRChart
- [ ] Выбор периода (1 мес / 3 мес / программа / всё время)

### 13.7 Avatar (голографический)

- `(app)/avatar/page.tsx`
- **HologramAvatar** (Three.js):
  1. Загрузить glTF base mesh (human model)
  2. Применить morph targets из `avatarApi.useGetCurrentQuery()`:
     - heightScale → scale transform
     - shoulderWidth/chestDepth/waistWidth/hipWidth → morph targets
     - armGirth, thighGirth → morph targets
     - muscleDefinition, bodyFatLayer → shader uniforms
  3. Hologram shader: scanlines + fresnel + glow
- **TransformationTimeline** — слайдер по неделям, анимация морфинга между snapshots
- **AvatarFallback2D** — если WebGL не доступен или на слабом устройстве: SVG-силуэт с той же логикой параметров

**Чеклист**:
- [ ] Three.js setup + glTF base mesh
- [ ] Morph targets с маппингом из avatarApi
- [ ] Hologram shader
- [ ] TransformationTimeline с interpolation
- [ ] 2D-fallback (SVG силуэт)
- [ ] Responsive (low-poly для мобильных)

### 13.8 Alerts

- `(app)/alerts/page.tsx`
- Список активных алертов
- AlertCard: severity badge + title + message + recommendation + 2 кнопки ("Применить", "Скрыть")
- На "Применить" → `alertsApi.act()` → toast "Делoad запланирован на следующую неделю" / "Калории пересчитаны"

### 13.9 Settings

- `(app)/settings/page.tsx`:
  - Редактирование профиля (все секции: physical, experience, goals, equipment, lifestyle)
  - Lifestyle Re-check (sleep/stress/activity) — можно обновить в любой момент, пересчитает план
  - **Re-screening** — заново пройти PAR-Q+
  - Переключатель RIR ↔ RPE предпочтения
  - Кнопка "Regenerate program"
  - Смена email / пароля
  - Удаление аккаунта

**Чеклист**:
- [ ] Settings page с секциями
- [ ] Lifestyle re-check
- [ ] Re-screening
- [ ] RIR/RPE preference toggle
- [ ] Regenerate program
- [ ] Удаление аккаунта с подтверждением

---

## Этап 14: Визуализация (Recharts)

### 14.1 Трансформационный слой

**Файл**: `src/lib/chart-transforms.ts`

Функции из architecture.md 8.3:
- `transformExerciseProgress(logs)` → `{ date, maxWeight, bestSet, e1RM }[]`
- `transformBodyWeight(measurements)` → `{ date, weightKg, avg7d, avg14d }[]` с rolling avg
- `transformWeeklyVolumeLoad(logs)` → `{ week, volumeLoad }[]`
- `transformWeeklyInternalLoad(sessionRPELogs)` → `{ week, internalLoad }[]`
- `transformE1RMByMainLifts(logs, mainLifts)` → `{ week, e1RM, exercise }[]`
- `calculateEstimated1RM(weight, reps)` → `number` (Эпли)
- `rirToRPE(rir)` / `rpeToRIR(rpe)`
- `calculateRollingAverage(values, windowDays)`

**Чеклист**:
- [ ] Все 8 трансформаций
- [ ] Unit-тесты: пустые массивы, одна запись, типичные сценарии

### 14.2 Компоненты графиков

Все из `components/charts/` (architecture.md 6.2):
- **WeightChart** — LineChart с 3 линиями (raw, avg7d, avg14d)
- **VolumeLoadChart** — BarChart, тоннаж по неделям
- **InternalLoadChart** — BarChart, session-RPE × duration
- **E1RMChart** — LineChart multi-line по main_lifts
- **BestSetChart** — LineChart
- **ExerciseProgressChart** — LineChart dual Y-axis (вес + объём)
- **BodyCompositionChart** — LineChart multi-line (обхваты)
- **AvgRIRChart** — LineChart + reference lines (`y=0` = overtraining warning)
- **ConsistencyChart** — BarChart %
- **MacrosChart** — PieChart

Каждый компонент:
- Responsive (ResponsiveContainer)
- Tooltip с форматированием (кг / повторы / % / ккал)
- Пустое состояние
- Выбор периода (1 мес / программа / всё время)

**Чеклист**:
- [ ] Все 10 графиков
- [ ] Responsive
- [ ] Empty states
- [ ] Period switcher

---

## Этап 15: Фоновые задачи (Bull Queue)

### 15.1 Настройка

Установить `@nestjs/bull`, настроить `BullModule.forRootAsync` с Redis конфигом.

### 15.2 Задачи (architecture.md 9.4)

**recalculate-analytics**:
- Триггер: после `completeDay()`
- Пересчёт агрегатов дашборда, инвалидация Redis-кэша

**check-progression**:
- Триггер: после завершения последнего дня недели
- `TrainingEngine.calculateProgression()` для каждого упражнения следующей недели
- Обновить target_load_kg, target_rir, sets

**run-alert-detectors**:
- Триггер: Cron ежедневно 6:00 + event `progress.logged`, `session.rpe.logged`
- `AlertsService.runAllDetectors(userId)` для всех активных пользователей
- Дедупликация: если такой же type алерт уже активен — не создавать

**recalibrate-nutrition**:
- Триггер: Cron еженедельно (воскресенье 20:00)
- Для каждого активного плана: `NutritionService.recalibrate(userId)` по 14-day weight trend

**recalculate-body-scoring**:
- Триггер: события `profile.updated`, `measurement.added`
- `BodyTypeService.recalculate()` → `AvatarService.recalculate()`

**weekly-report**:
- Триггер: Cron понедельник 9:00
- Генерация 3 UX-инсайтов на неделю

**cleanup-expired-tokens**:
- Триггер: Cron ежедневно 3:00
- DELETE устаревших refresh_token_hash

**Чеклист**:
- [ ] Bull настроен + Redis connection
- [ ] 7 процессоров реализованы
- [ ] Event listeners для async-триггеров
- [ ] Cron schedules
- [ ] Тесты процессоров

---

## Этап 16: Redis-кэширование

### 12.1 Настройка

1. Установить `@nestjs/cache-manager`, `cache-manager-ioredis`
2. Настроить CacheModule в AppModule

### 12.2 Кэширование

Из architecture.md 9.2:

- Декоратор `@CacheKey()` + `@CacheTTL()` на эндпоинтах
- Ручная инвалидация при записи прогресса

| Ключ | TTL | Инвалидация |
|------|-----|-------------|
| `dashboard:{userId}` | 2 мин | При записи прогресса/замера |
| `program:active:{userId}` | 5 мин | При генерации программы |
| `catalog:exercises` | 1 час | При изменении каталога |
| `records:{userId}` | 5 мин | При записи прогресса |

**Чеклист**:
- [ ] Redis подключен
- [ ] CacheInterceptor настроен
- [ ] Кэширование dashboard
- [ ] Кэширование активной программы
- [ ] Кэширование каталога
- [ ] Инвалидация работает

---

## Этап 17: Тестирование и полировка

### 17.1 Backend тесты

- [ ] Unit-тесты для всех сервисов (>80% coverage)
- [ ] Unit-тесты для TrainingEngine (100% coverage)
- [ ] Unit-тесты для калькуляторов питания (calories, macros) — проверка границ safeguards
- [ ] Unit-тесты для body-type scoring (3 calculators + classifier)
- [ ] Unit-тесты для alert detectors (все 4)
- [ ] e2e тесты для всех контроллеров
- [ ] e2e полный сценарий: register → PAR-Q+ → profile → generate → workout (со всеми подходами + RIR + session-RPE) → progress → analytics → alert triggered → act on alert → deload запланирован

### 13.2 Frontend тесты

- [ ] Проверить все страницы в браузере
- [ ] Проверить mobile responsive
- [ ] Проверить loading/error states
- [ ] Проверить edge cases (пустой профиль, нет программы)

### 13.3 Полировка

- [ ] Error handling: все ошибки API → понятные сообщения
- [ ] Loading states: Skeleton на всех страницах
- [ ] Empty states: заглушки когда нет данных
- [ ] Оптимизация: проверить N+1 запросы
- [ ] Безопасность: проверить что user видит только свои данные

---

## Этап 18: Docker и деплой

### 14.1 Docker

```
docker-compose.yml:
  - postgres (5432)
  - redis (6379)
  - api (3001)
  - web (3000)
```

Dockerfiles:
- `fittrack-api/Dockerfile` — multi-stage build
- `fittrack-web/Dockerfile` — multi-stage build

### 14.2 Env

- `.env.production` с реальными значениями
- Секреты через environment variables (не в коде)

**Чеклист**:
- [ ] docker-compose.yml
- [ ] API Dockerfile
- [ ] Web Dockerfile
- [ ] Все запускается через `docker-compose up`
- [ ] Миграции запускаются автоматически

---

## Порядок реализации (summary — синхронизирован с sport-research.md)

```
Этап 0:  Инициализация (NestJS + Next.js + PostgreSQL)     █░░░░░░░░░
Этап 1:  UserModule (auth)                                  █░░░░░░░░░
Этап 2:  PreScreeningModule (PAR-Q+)              ← NEW     ██░░░░░░░░
Этап 3:  ProfileModule (с lifestyle)                        ██░░░░░░░░
Этап 4:  BodyTypeModule (numeric scoring)         ← NEW     ███░░░░░░░
Этап 5:  AvatarModule (параметры)                 ← NEW     ███░░░░░░░
Этап 6:  TrainingEngine (12-нед, RIR, double prog)          ████░░░░░░
Этап 7:  TrainingModule (movement patterns)                 █████░░░░░
Этап 8:  ProgressModule (RIR + sRPE + e1RM + VL)            █████░░░░░
Этап 9:  NutritionModule (3 тира + meal templates)          ██████░░░░
Этап 10: AnalyticsModule (e1RM, insights)                   ██████░░░░
Этап 11: AlertsModule (плато/регресс/перетрен)   ← NEW     ███████░░░
Этап 12: Frontend — каркас                                  ███████░░░
Этап 13: Frontend — страницы (вкл. Avatar 3D)               ████████░░
Этап 14: Визуализация (Recharts)                            █████████░
Этап 15: Фоновые задачи (Bull)                              █████████░
Этап 16: Redis-кэширование                                  █████████░
Этап 17: Тесты и полировка                                  ██████████
Этап 18: Docker и деплой                                    ██████████
```

## Инварианты и safeguards (не нарушать!)

При реализации любого этапа держать в голове предохранители из architecture.md 1:

1. **pre-screening gate**: redFlags=true → режим LOW_INTENSITY (фиксированный шаблон)
2. **дефицит**: max 1 кг/нед потери, max −600 ккал от TDEE
3. **прогрессия**: max +10% нагрузки за неделю на упражнение
4. **делoad**: обязательные недели 4, 8, 12 + принудительный по триггерам (RPE>9 три нед, e1RM drop>5%)
5. **травм-фильтр**: exercises с `contraindications ∩ injuries ≠ ∅` исключаются
6. **beginner cap**: novice max 4 трен/нед

Эти правила — сквозные через `TrainingEngine`, `NutritionService`, `AlertsService`. При любом сомнении — сверяться с `sport-research.md`.

Каждый этап — отдельная ветка git, отдельный PR. После этапа — обновить `context.md`.
