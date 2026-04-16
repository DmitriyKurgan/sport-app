import { MigrationInterface, QueryRunner } from 'typeorm';
import { EXERCISES_SEED } from '../modules/training/seed/exercises.seed';

/**
 * Заливает базовый каталог упражнений.
 * Идемпотентна: ON CONFLICT (slug) DO NOTHING.
 */
export class SeedExercises1713000100000 implements MigrationInterface {
  name = 'SeedExercises1713000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const ex of EXERCISES_SEED) {
      await queryRunner.query(
        `INSERT INTO exercises (
          slug, name, name_ru,
          movement_patterns, primary_muscles, secondary_muscles,
          joint_involvement, contraindications,
          equipment_required, equipment_access_min,
          difficulty, technical_demand,
          progression_chain, progression_order,
          is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true
        ) ON CONFLICT (slug) DO NOTHING;`,
        [
          ex.slug,
          ex.name,
          ex.nameRu,
          ex.movementPatterns,
          ex.primaryMuscles,
          ex.secondaryMuscles ?? [],
          ex.jointInvolvement,
          ex.contraindications ?? [],
          ex.equipmentRequired,
          ex.equipmentAccessMin,
          ex.difficulty,
          ex.technicalDemand,
          ex.progressionChain ?? null,
          ex.progressionOrder ?? null,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = EXERCISES_SEED.map((e) => e.slug);
    await queryRunner.query(`DELETE FROM exercises WHERE slug = ANY($1);`, [slugs]);
  }
}
