import request from 'supertest';
import { createE2EApp, E2ESetup, teardownE2EApp } from './e2e-app.factory';

const VALID_PASSWORD = 'StrongPass123';

const PARQ_ALL_NO = {
  heart_condition: false,
  chest_pain_activity: false,
  chest_pain_rest: false,
  balance_dizzy: false,
  bone_joint: false,
  medication_bp_heart: false,
  other_reason: false,
  pregnant: false,
};

const PROFILE_DTO = {
  sex: 'male',
  ageYears: 28,
  heightCm: 178,
  weightKg: 78,
  experienceLevel: 'novice',
  currentTrainingDaysPerWeek: 1,
  technicalConfidence: 'medium',
  primaryTrainingGoal: 'hypertrophy',
  bodyweightGoal: 'maintain',
  weeklyTrainingDaysTarget: 3,
  sessionDurationMinutes: 60,
  equipmentAccess: 'gym',
  injuryPainFlags: [],
  sleepHoursAvg: 7,
  stressLevel: 'medium',
  dailyActivityLevel: 'moderate',
  nutritionTierPreference: 'standard',
  dietaryRestrictions: [],
};

describe('FitTrack — full onboarding & training flow (e2e)', () => {
  let setup: E2ESetup;
  let httpServer: any;
  let accessToken: string;
  let refreshToken: string;
  let userEmail: string;
  let activeProgramId: string;
  let firstDayId: string;

  beforeAll(async () => {
    setup = await createE2EApp();
    httpServer = setup.app.getHttpServer();
    userEmail = `e2e-${Date.now()}@test.local`;
  });

  afterAll(async () => {
    await teardownE2EApp(setup);
  });

  // ---------------- AUTH ----------------

  it('POST /auth/register — создаёт пользователя и возвращает токены', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({ email: userEmail, password: VALID_PASSWORD, firstName: 'E2E', lastName: 'Tester' })
      .expect(201);

    expect(res.body.user.email).toBe(userEmail);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/register — отклоняет дубликат с локализованным сообщением', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({ email: userEmail, password: VALID_PASSWORD, firstName: 'E2E', lastName: 'Tester' })
      .expect(409);

    expect(String(res.body.message)).toMatch(/уже зарегистрирован/i);
  });

  it('POST /auth/register — валидация локализована (i18n pipe)', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    const joined = (res.body.message as string[]).join(' ');
    expect(joined).toMatch(/email|пароль|короче/i);
  });

  it('POST /auth/login — возвращает свежие токены', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('GET /users/me — требует JWT и возвращает профиль', async () => {
    await request(httpServer).get('/api/v1/users/me').expect(401);

    const res = await request(httpServer)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(userEmail);
  });

  // ---------------- PRE-SCREENING ----------------

  it('GET /screening/questions — публичный список вопросов', async () => {
    const res = await request(httpServer).get('/api/v1/screening/questions').expect(200);
    expect(res.body.questions.length).toBeGreaterThanOrEqual(8);
  });

  it('POST /screening — принимает ответы, redFlags=false', async () => {
    const res = await request(httpServer)
      .post('/api/v1/screening')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers: PARQ_ALL_NO })
      .expect(201);

    expect(res.body.redFlags).toBe(false);
    expect(res.body.redFlagReasons).toEqual([]);
  });

  it('POST /screening — отклоняет неполные ответы', async () => {
    const partial = { ...PARQ_ALL_NO } as Record<string, boolean>;
    delete partial.pregnant;

    const res = await request(httpServer)
      .post('/api/v1/screening')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers: partial })
      .expect(400);

    expect(String(res.body.message)).toMatch(/Отсутствуют ответы/i);
  });

  // ---------------- PROFILE ----------------

  it('POST /profile — создаёт профиль с производными показателями', async () => {
    const res = await request(httpServer)
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PROFILE_DTO)
      .expect(201);

    expect(res.body.heightCm).toBe(PROFILE_DTO.heightCm);
    expect(res.body.bmi).toBeGreaterThan(20);
    expect(res.body.bmi).toBeLessThan(30);
    expect(res.body.ree).toBeGreaterThan(1400);
    expect(res.body.tdee).toBeGreaterThan(res.body.ree);
  });

  it('POST /profile — отклоняет повторное создание', async () => {
    const res = await request(httpServer)
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PROFILE_DTO)
      .expect(409);

    expect(String(res.body.message)).toMatch(/уже создан/i);
  });

  it('GET /profile — возвращает созданный профиль', async () => {
    const res = await request(httpServer)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.heightCm).toBe(PROFILE_DTO.heightCm);
    expect(res.body.weightKg).toBe(PROFILE_DTO.weightKg);
  });

  // ---------------- BODY-TYPE & AVATAR ----------------

  it('POST /body-type/recalculate — классифицирует и сохраняет', async () => {
    const res = await request(httpServer)
      .post('/api/v1/body-type/recalculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(['ectomorph', 'mesomorph', 'endomorph', 'hybrid']).toContain(res.body.classification);
  });

  it('POST /avatar/recalculate — генерирует параметры аватара', async () => {
    const res = await request(httpServer)
      .post('/api/v1/avatar/recalculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.shoulderWidth).toBeGreaterThan(0);
    expect(res.body.bodyFatLayer).toBeGreaterThanOrEqual(0);
    expect(res.body.bodyFatLayer).toBeLessThanOrEqual(1);
  });

  // ---------------- TRAINING PROGRAM ----------------

  it('POST /training/programs/generate — создаёт 12-недельную программу', async () => {
    const res = await request(httpServer)
      .post('/api/v1/training/programs/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.weeks).toHaveLength(12);
    expect(res.body.weeks[0].days.length).toBeGreaterThan(0);
    activeProgramId = res.body.id;
    firstDayId = res.body.weeks[0].days[0].id;
  });

  it('GET /training/programs/active — возвращает активную программу', async () => {
    const res = await request(httpServer)
      .get('/api/v1/training/programs/active')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(activeProgramId);
  });

  it('GET /training/programs/:id/weeks/1 — детали недели 1', async () => {
    const res = await request(httpServer)
      .get(`/api/v1/training/programs/${activeProgramId}/weeks/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].exercises.length).toBeGreaterThan(0);
  });

  // ---------------- WORKOUT FLOW ----------------

  it('POST /training/days/:id/start — стартует тренировку', async () => {
    const res = await request(httpServer)
      .post(`/api/v1/training/days/${firstDayId}/start`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.startedAt).toBeDefined();
  });

  it('POST /training/days/:id/start — повторный старт отклонён', async () => {
    const res = await request(httpServer)
      .post(`/api/v1/training/days/${firstDayId}/start`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(String(res.body.message)).toMatch(/уже начата/i);
  });

  it('POST /progress/log — логирует подход с e1RM/volume_load', async () => {
    const dayRes = await request(httpServer)
      .get(`/api/v1/training/days/${firstDayId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const exerciseId = dayRes.body.exercises[0].exerciseId;
    expect(exerciseId).toBeDefined();

    const res = await request(httpServer)
      .post('/api/v1/progress/log')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        exerciseId,
        trainingDayId: firstDayId,
        setNumber: 1,
        weightKg: 60,
        reps: 8,
        rir: 2,
      })
      .expect(201);

    expect(res.body.estimated1rm).toBeGreaterThan(60);
    expect(res.body.volumeLoad).toBe(60 * 8);
  });

  it('POST /progress/session-rpe — логирует общий RPE сессии', async () => {
    const res = await request(httpServer)
      .post('/api/v1/progress/session-rpe')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ trainingDayId: firstDayId, sessionRpe: 7, durationMinutes: 55 })
      .expect(201);

    expect(res.body.sessionRpe).toBe(7);
    expect(res.body.internalLoad).toBeCloseTo(7 * 55, 0);
  });

  it('POST /training/days/:id/complete — завершает тренировку', async () => {
    const res = await request(httpServer)
      .post(`/api/v1/training/days/${firstDayId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.completedAt).toBeDefined();
  });

  // ---------------- DASHBOARD / ANALYTICS ----------------

  it('GET /analytics/dashboard — агрегаты доступны', async () => {
    const res = await request(httpServer)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('currentProgram');
    expect(res.body).toHaveProperty('weekProgress');
    expect(res.body).toHaveProperty('consistencyScore');
    expect(res.body.currentProgram?.id).toBe(activeProgramId);
  });

  it('GET /progress/records — содержит PR для проработанного упражнения', async () => {
    const res = await request(httpServer)
      .get('/api/v1/progress/records')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // ---------------- NUTRITION ----------------

  it('POST /nutrition/generate — создаёт активный план', async () => {
    const res = await request(httpServer)
      .post('/api/v1/nutrition/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.caloriesTarget).toBeGreaterThan(1500);
    expect(res.body.proteinG).toBeGreaterThan(80);
    expect(Array.isArray(res.body.meals)).toBe(true);
  });

  it('GET /nutrition/plan — возвращает активный план', async () => {
    const res = await request(httpServer)
      .get('/api/v1/nutrition/plan')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.isActive).toBe(true);
  });

  // ---------------- AUTH REFRESH / LOGOUT ----------------

  it('POST /auth/refresh — выдаёт новые токены', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /auth/logout — отзывает refresh', async () => {
    await request(httpServer)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });
});
