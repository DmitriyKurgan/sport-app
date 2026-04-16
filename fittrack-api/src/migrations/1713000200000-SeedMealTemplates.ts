import { MigrationInterface, QueryRunner } from 'typeorm';
import { MEAL_TEMPLATES_SEED } from '../modules/nutrition/seed/meal-templates.seed';

export class SeedMealTemplates1713000200000 implements MigrationInterface {
  name = 'SeedMealTemplates1713000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const t of MEAL_TEMPLATES_SEED) {
      await queryRunner.query(
        `INSERT INTO meal_templates (
          slug, name, tier, meal_type, day_template,
          calories, protein_g, fat_g, carbs_g,
          ingredients, instructions, dietary_tags, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10::jsonb, $11, $12, true
        ) ON CONFLICT (slug) DO NOTHING;`,
        [
          t.slug,
          t.name,
          t.tier,
          t.mealType,
          t.dayTemplate,
          t.calories,
          t.proteinG,
          t.fatG,
          t.carbsG,
          JSON.stringify(t.ingredients),
          t.instructions ?? null,
          t.dietaryTags ?? [],
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = MEAL_TEMPLATES_SEED.map((t) => t.slug);
    await queryRunner.query(`DELETE FROM meal_templates WHERE slug = ANY($1);`, [slugs]);
  }
}
