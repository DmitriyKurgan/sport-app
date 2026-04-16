import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema для FitTrack.
 * Создаёт все таблицы, описанные в architecture.md раздел 3.
 * Порядок критичен из-за FK: users → profiles/screenings/etc.
 */
export class InitialSchema1713000000000 implements MigrationInterface {
  name = 'InitialSchema1713000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Расширение для gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // === users ===
    await queryRunner.query(`
      CREATE TABLE users (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email               VARCHAR(255) NOT NULL,
        password_hash       VARCHAR(255) NOT NULL,
        first_name          VARCHAR(50) NOT NULL,
        last_name           VARCHAR(50) NOT NULL,
        refresh_token_hash  VARCHAR(255),
        is_active           BOOLEAN NOT NULL DEFAULT true,
        deleted_at          TIMESTAMP,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;`,
    );

    // === profiles ===
    await queryRunner.query(`
      CREATE TABLE profiles (
        id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        sex                            VARCHAR(10) NOT NULL,
        age_years                      SMALLINT NOT NULL,
        height_cm                      DECIMAL(5,1) NOT NULL,
        weight_kg                      DECIMAL(5,1) NOT NULL,
        waist_cm                       DECIMAL(5,1),
        experience_level               VARCHAR(15) NOT NULL,
        current_training_days_per_week SMALLINT NOT NULL,
        technical_confidence           VARCHAR(10),
        baseline_squat_kg              DECIMAL(5,1),
        baseline_bench_kg              DECIMAL(5,1),
        baseline_deadlift_kg           DECIMAL(5,1),
        baseline_pullups_max           SMALLINT,
        primary_training_goal          VARCHAR(20) NOT NULL,
        bodyweight_goal                VARCHAR(10) NOT NULL,
        weekly_training_days_target    SMALLINT NOT NULL,
        session_duration_minutes       SMALLINT NOT NULL,
        equipment_access               VARCHAR(20) NOT NULL,
        injury_pain_flags              TEXT[] NOT NULL DEFAULT '{}',
        pre_screening_red_flags        BOOLEAN NOT NULL DEFAULT false,
        sleep_hours_avg                DECIMAL(3,1) NOT NULL,
        stress_level                   VARCHAR(10) NOT NULL,
        daily_activity_level           VARCHAR(15) NOT NULL,
        nutrition_tier_preference      VARCHAR(15) NOT NULL,
        dietary_restrictions           TEXT[] NOT NULL DEFAULT '{}',
        bmi                            DECIMAL(4,1),
        ree                            INTEGER,
        tdee                           INTEGER,
        activity_factor                DECIMAL(3,2),
        created_at                     TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at                     TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_profiles_user ON profiles(user_id);`);

    // === pre_screenings ===
    await queryRunner.query(`
      CREATE TABLE pre_screenings (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        answers           JSONB NOT NULL,
        red_flags         BOOLEAN NOT NULL,
        red_flag_reasons  TEXT[] NOT NULL DEFAULT '{}',
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_screenings_user ON pre_screenings(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_screenings_user_date ON pre_screenings(user_id, created_at DESC);`,
    );

    // === body_type_snapshots ===
    await queryRunner.query(`
      CREATE TABLE body_type_snapshots (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        adiposity_score       DECIMAL(4,2) NOT NULL,
        muscularity_score     DECIMAL(4,2) NOT NULL,
        linearity_score       DECIMAL(4,2) NOT NULL,
        classification        VARCHAR(15) NOT NULL,
        dominant_components   TEXT[] NOT NULL DEFAULT '{}',
        confidence            VARCHAR(10) NOT NULL,
        created_at            TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_body_type_user_date ON body_type_snapshots(user_id, created_at DESC);`,
    );

    // === avatar_snapshots ===
    await queryRunner.query(`
      CREATE TABLE avatar_snapshots (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        height_scale        DECIMAL(4,3) NOT NULL,
        shoulder_width      DECIMAL(4,3) NOT NULL,
        chest_depth         DECIMAL(4,3) NOT NULL,
        waist_width         DECIMAL(4,3) NOT NULL,
        hip_width           DECIMAL(4,3) NOT NULL,
        arm_girth           DECIMAL(4,3) NOT NULL,
        thigh_girth         DECIMAL(4,3) NOT NULL,
        muscle_definition   DECIMAL(3,2) NOT NULL,
        body_fat_layer      DECIMAL(3,2) NOT NULL,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_avatar_user_date ON avatar_snapshots(user_id, created_at DESC);`,
    );

    // === alerts ===
    await queryRunner.query(`
      CREATE TABLE alerts (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type            VARCHAR(30) NOT NULL,
        severity        VARCHAR(10) NOT NULL,
        title           VARCHAR(100) NOT NULL,
        message         TEXT NOT NULL,
        recommendation  TEXT NOT NULL,
        context         JSONB,
        triggered_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        dismissed_at    TIMESTAMP,
        acted_upon      BOOLEAN NOT NULL DEFAULT false,
        acted_at        TIMESTAMP
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_alerts_user_active ON alerts(user_id) WHERE dismissed_at IS NULL;`,
    );
    await queryRunner.query(`CREATE INDEX idx_alerts_user_type ON alerts(user_id, type);`);

    // === exercises (каталог) ===
    await queryRunner.query(`
      CREATE TABLE exercises (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug                  VARCHAR(60) NOT NULL UNIQUE,
        name                  VARCHAR(100) NOT NULL,
        name_ru               VARCHAR(100),
        description           TEXT,
        movement_patterns     TEXT[] NOT NULL,
        primary_muscles       TEXT[] NOT NULL,
        secondary_muscles     TEXT[] NOT NULL DEFAULT '{}',
        joint_involvement     TEXT[] NOT NULL,
        contraindications     TEXT[] NOT NULL DEFAULT '{}',
        equipment_required    TEXT[] NOT NULL,
        equipment_access_min  VARCHAR(20) NOT NULL,
        difficulty            SMALLINT NOT NULL,
        technical_demand      VARCHAR(10) NOT NULL,
        progression_chain     TEXT[],
        progression_order     SMALLINT,
        instructions          TEXT,
        video_url             VARCHAR(500),
        image_url             VARCHAR(500),
        is_active             BOOLEAN NOT NULL DEFAULT true,
        created_at            TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_exercises_movement_pattern ON exercises USING GIN(movement_patterns);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_exercises_equipment ON exercises USING GIN(equipment_required);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_exercises_contraindications ON exercises USING GIN(contraindications);`,
    );
    await queryRunner.query(`CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);`);

    // === training_programs ===
    await queryRunner.query(`
      CREATE TABLE training_programs (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name                    VARCHAR(100) NOT NULL,
        description             TEXT,
        status                  VARCHAR(15) NOT NULL DEFAULT 'active',
        total_weeks             SMALLINT NOT NULL DEFAULT 12,
        primary_goal            VARCHAR(20) NOT NULL,
        experience_level        VARCHAR(15) NOT NULL,
        split_type              VARCHAR(30) NOT NULL,
        weekly_days             SMALLINT NOT NULL,
        is_low_intensity_mode   BOOLEAN NOT NULL DEFAULT false,
        config_snapshot         JSONB,
        started_at              TIMESTAMP,
        completed_at            TIMESTAMP,
        created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_programs_user ON training_programs(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_programs_user_active ON training_programs(user_id, status) WHERE status = 'active';`,
    );

    // === training_weeks ===
    await queryRunner.query(`
      CREATE TABLE training_weeks (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id          UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
        week_number         SMALLINT NOT NULL,
        phase               VARCHAR(20) NOT NULL,
        mesocycle_number    SMALLINT NOT NULL,
        description         VARCHAR(255),
        is_deload           BOOLEAN NOT NULL DEFAULT false,
        intensity_modifier  DECIMAL(3,2) NOT NULL DEFAULT 1.0,
        volume_modifier     DECIMAL(3,2) NOT NULL DEFAULT 1.0,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_weeks_program ON training_weeks(program_id);`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_weeks_program_number ON training_weeks(program_id, week_number);`,
    );

    // === training_days ===
    await queryRunner.query(`
      CREATE TABLE training_days (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        week_id         UUID NOT NULL REFERENCES training_weeks(id) ON DELETE CASCADE,
        day_number      SMALLINT NOT NULL,
        name            VARCHAR(50) NOT NULL,
        description     TEXT,
        target_muscles  TEXT[] NOT NULL DEFAULT '{}',
        is_rest_day     BOOLEAN NOT NULL DEFAULT false,
        started_at      TIMESTAMP,
        completed_at    TIMESTAMP,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_days_week ON training_days(week_id);`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_days_week_number ON training_days(week_id, day_number);`,
    );

    // === training_day_exercises ===
    await queryRunner.query(`
      CREATE TABLE training_day_exercises (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        day_id          UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
        exercise_id     UUID NOT NULL REFERENCES exercises(id),
        role            VARCHAR(15) NOT NULL,
        order_index     SMALLINT NOT NULL,
        sets            SMALLINT NOT NULL,
        reps_min        SMALLINT NOT NULL,
        reps_max        SMALLINT NOT NULL,
        target_rir      SMALLINT,
        target_load_kg  DECIMAL(5,1),
        load_pct_e1rm   DECIMAL(4,1),
        rest_seconds    SMALLINT NOT NULL DEFAULT 90,
        tempo           VARCHAR(10),
        notes           TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_day_exercises_day ON training_day_exercises(day_id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_day_exercises_order ON training_day_exercises(day_id, order_index);`,
    );

    // === progress_logs ===
    await queryRunner.query(`
      CREATE TABLE progress_logs (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_id       UUID NOT NULL REFERENCES exercises(id),
        training_day_id   UUID REFERENCES training_days(id),
        day_exercise_id   UUID REFERENCES training_day_exercises(id),
        set_number        SMALLINT NOT NULL,
        weight_kg         DECIMAL(6,2) NOT NULL,
        reps              SMALLINT NOT NULL,
        rir               SMALLINT,
        rpe               DECIMAL(3,1),
        estimated_1rm     DECIMAL(6,2),
        volume_load       DECIMAL(8,2),
        is_warmup         BOOLEAN NOT NULL DEFAULT false,
        notes             TEXT,
        performed_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_progress_user ON progress_logs(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_progress_user_exercise ON progress_logs(user_id, exercise_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_progress_user_date ON progress_logs(user_id, performed_at);`,
    );
    await queryRunner.query(`CREATE INDEX idx_progress_day ON progress_logs(training_day_id);`);

    // === session_rpe_logs ===
    await queryRunner.query(`
      CREATE TABLE session_rpe_logs (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        training_day_id   UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
        session_rpe       DECIMAL(3,1) NOT NULL,
        duration_minutes  SMALLINT NOT NULL,
        internal_load     DECIMAL(8,2) NOT NULL,
        recorded_at       TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_session_rpe_user ON session_rpe_logs(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_session_rpe_user_date ON session_rpe_logs(user_id, recorded_at);`,
    );

    // === body_measurements ===
    await queryRunner.query(`
      CREATE TABLE body_measurements (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weight_kg         DECIMAL(5,1) NOT NULL,
        body_fat_percent  DECIMAL(4,1),
        chest_cm          DECIMAL(5,1),
        waist_cm          DECIMAL(5,1),
        hips_cm           DECIMAL(5,1),
        biceps_cm         DECIMAL(4,1),
        thigh_cm          DECIMAL(5,1),
        photo_url         VARCHAR(500),
        measured_at       TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_measurements_user ON body_measurements(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_measurements_user_date ON body_measurements(user_id, measured_at);`,
    );

    // === nutrition_plans ===
    await queryRunner.query(`
      CREATE TABLE nutrition_plans (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tier                VARCHAR(15) NOT NULL,
        bodyweight_goal     VARCHAR(10) NOT NULL,
        current_phase       VARCHAR(20),
        calories_target     SMALLINT NOT NULL,
        protein_g           SMALLINT NOT NULL,
        fat_g               SMALLINT NOT NULL,
        carbs_g             SMALLINT NOT NULL,
        protein_per_meal_g  SMALLINT NOT NULL,
        meals_per_day       SMALLINT NOT NULL DEFAULT 4,
        supplements         JSONB,
        is_active           BOOLEAN NOT NULL DEFAULT true,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_nutrition_user ON nutrition_plans(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_nutrition_user_active ON nutrition_plans(user_id) WHERE is_active = true;`,
    );

    // === meal_templates ===
    await queryRunner.query(`
      CREATE TABLE meal_templates (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug            VARCHAR(60) NOT NULL UNIQUE,
        name            VARCHAR(100) NOT NULL,
        tier            VARCHAR(15) NOT NULL,
        meal_type       VARCHAR(15) NOT NULL,
        day_template    VARCHAR(25) NOT NULL,
        calories        SMALLINT NOT NULL,
        protein_g       DECIMAL(5,1) NOT NULL,
        fat_g           DECIMAL(5,1) NOT NULL,
        carbs_g         DECIMAL(5,1) NOT NULL,
        ingredients     JSONB NOT NULL,
        instructions    TEXT,
        dietary_tags    TEXT[] NOT NULL DEFAULT '{}',
        is_active       BOOLEAN NOT NULL DEFAULT true,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_meal_templates_tier_type ON meal_templates(tier, meal_type);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_meal_templates_dietary ON meal_templates USING GIN(dietary_tags);`,
    );

    // === nutrition_plan_meals ===
    await queryRunner.query(`
      CREATE TABLE nutrition_plan_meals (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id       UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
        template_id   UUID NOT NULL REFERENCES meal_templates(id),
        day_type      VARCHAR(25) NOT NULL,
        order_index   SMALLINT NOT NULL,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_npm_plan ON nutrition_plan_meals(plan_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Обратный порядок (из-за FK)
    await queryRunner.query(`DROP TABLE IF EXISTS nutrition_plan_meals;`);
    await queryRunner.query(`DROP TABLE IF EXISTS meal_templates;`);
    await queryRunner.query(`DROP TABLE IF EXISTS nutrition_plans;`);
    await queryRunner.query(`DROP TABLE IF EXISTS body_measurements;`);
    await queryRunner.query(`DROP TABLE IF EXISTS session_rpe_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS progress_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS training_day_exercises;`);
    await queryRunner.query(`DROP TABLE IF EXISTS training_days;`);
    await queryRunner.query(`DROP TABLE IF EXISTS training_weeks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS training_programs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS exercises;`);
    await queryRunner.query(`DROP TABLE IF EXISTS alerts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS avatar_snapshots;`);
    await queryRunner.query(`DROP TABLE IF EXISTS body_type_snapshots;`);
    await queryRunner.query(`DROP TABLE IF EXISTS pre_screenings;`);
    await queryRunner.query(`DROP TABLE IF EXISTS profiles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
