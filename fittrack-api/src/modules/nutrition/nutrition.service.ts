import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayOverlap, DataSource, Repository } from 'typeorm';
import {
  BodyweightGoal,
  DietaryRestriction,
  NutritionTier,
} from '../profile/enums';
import { ProfileService } from '../profile/profile.service';
import { ProgramPhase } from '../training-engine/enums';
import { TrainingProgramService } from '../training/services/training-program.service';
import {
  calculateCalorieTarget,
  calculateMacros,
  MacrosResult,
} from './calculators';
import {
  DayTemplate,
  MealTemplate,
  NutritionPlan,
  NutritionPlanMeal,
  SupplementInfo,
} from './entities';
import { NutritionPlanResponseDto } from './dto/response.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    @InjectRepository(NutritionPlan)
    private readonly planRepo: Repository<NutritionPlan>,
    @InjectRepository(MealTemplate)
    private readonly templateRepo: Repository<MealTemplate>,
    private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
    private readonly programService: TrainingProgramService,
  ) {}

  // ============= generate =============

  async generatePlan(userId: string): Promise<NutritionPlanResponseDto> {
    const profile = await this.profileService.findByUserId(userId);
    if (!profile.tdee) {
      throw new BadRequestException(
        'TDEE не рассчитан в профиле — обновите профиль',
      );
    }

    // Текущая фаза программы (если активная программа есть)
    const currentPhase = await this.fetchCurrentPhase(userId);

    const calories = calculateCalorieTarget({
      tdee: profile.tdee,
      bodyweightGoal: profile.bodyweightGoal,
      phase: currentPhase,
    });

    const macros = calculateMacros({
      weightKg: profile.weightKg,
      calories,
      bodyweightGoal: profile.bodyweightGoal,
      tier: profile.nutritionTierPreference,
    });

    const supplements = NutritionService.defaultSupplements(
      profile.nutritionTierPreference,
    );

    // Подобрать meal templates
    const selectedMeals = await this.selectMealTemplates({
      tier: profile.nutritionTierPreference,
      restrictions: profile.dietaryRestrictions ?? [],
      caloriesTarget: calories,
      proteinTargetG: macros.proteinG,
    });

    return this.dataSource.transaction(async (manager) => {
      // Деактивировать предыдущий активный план
      await manager
        .getRepository(NutritionPlan)
        .update({ userId, isActive: true }, { isActive: false });

      const plan = new NutritionPlan();
      plan.userId = userId;
      plan.tier = profile.nutritionTierPreference;
      plan.bodyweightGoal = profile.bodyweightGoal;
      plan.currentPhase = currentPhase;
      plan.caloriesTarget = calories;
      plan.proteinG = macros.proteinG;
      plan.fatG = macros.fatG;
      plan.carbsG = macros.carbsG;
      plan.proteinPerMealG = macros.proteinPerMealG;
      plan.mealsPerDay = Math.max(3, selectedMeals.size);
      plan.supplements = supplements;
      plan.isActive = true;
      plan.meals = NutritionService.buildPlanMeals(selectedMeals);

      const saved = await manager.getRepository(NutritionPlan).save(plan);
      return this.loadPlanWithRelations(saved.id, manager);
    });
  }

  // ============= recalibrate =============

  /**
   * Пересчёт калорий по 14-day weight trend.
   * Вызывается из Bull job или по запросу пользователя.
   *
   * trendDeltaKg: положительная если вес растёт, отрицательная если падает.
   * Если |delta| < 0.3 кг — считаем "плато".
   */
  async recalibrate(userId: string, trendDeltaKg: number): Promise<NutritionPlanResponseDto> {
    const plan = await this.planRepo.findOne({
      where: { userId, isActive: true },
      relations: { meals: { template: true } },
    });
    if (!plan) throw new NotFoundException('Активный план питания не найден');

    const profile = await this.profileService.findByUserId(userId);
    const PLATEAU_THRESHOLD = 0.3;

    let delta = 0;
    if (Math.abs(trendDeltaKg) < PLATEAU_THRESHOLD) {
      // Плато — корректируем по цели
      if (plan.bodyweightGoal === BodyweightGoal.CUT) {
        delta = -100;
      } else if (plan.bodyweightGoal === BodyweightGoal.BULK) {
        delta = +100;
      }
    }

    if (delta === 0) {
      // Нет необходимости менять
      return NutritionPlanResponseDto.fromEntity(plan);
    }

    const newCalories = plan.caloriesTarget + delta;
    // Safeguard: не уходим ниже tdee−600 для cut и не выше tdee+400 для bulk
    const tdee = profile.tdee ?? newCalories;
    const safeCalories =
      plan.bodyweightGoal === BodyweightGoal.CUT
        ? Math.max(newCalories, tdee - 600)
        : Math.min(newCalories, tdee + 400);

    const macros = calculateMacros({
      weightKg: profile.weightKg,
      calories: safeCalories,
      bodyweightGoal: plan.bodyweightGoal,
      tier: plan.tier,
    });

    plan.caloriesTarget = safeCalories;
    plan.proteinG = macros.proteinG;
    plan.fatG = macros.fatG;
    plan.carbsG = macros.carbsG;
    plan.proteinPerMealG = macros.proteinPerMealG;
    await this.planRepo.save(plan);

    this.logger.log(
      `Recalibrated nutrition: userId=${userId}, delta=${delta} kcal, newCalories=${safeCalories}`,
    );
    return NutritionPlanResponseDto.fromEntity(plan);
  }

  // ============= queries =============

  async findActivePlan(userId: string): Promise<NutritionPlanResponseDto> {
    const plan = await this.planRepo.findOne({
      where: { userId, isActive: true },
      relations: { meals: { template: true } },
    });
    if (!plan) throw new NotFoundException('Активный план питания не найден');
    return NutritionPlanResponseDto.fromEntity(plan);
  }

  async getMealsByDay(
    planId: string,
    userId: string,
    dayType: DayTemplate = 'training_day',
  ): Promise<NutritionPlanResponseDto['meals']> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, userId },
      relations: { meals: { template: true } },
    });
    if (!plan) throw new NotFoundException('План не найден');

    const filtered = (plan.meals ?? []).filter((m) => m.dayType === dayType);
    return filtered
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((m) => ({
        orderIndex: m.orderIndex,
        dayType: m.dayType,
        template: {
          id: m.template.id,
          slug: m.template.slug,
          name: m.template.name,
          tier: m.template.tier,
          mealType: m.template.mealType,
          dayTemplate: m.template.dayTemplate,
          calories: m.template.calories,
          proteinG: m.template.proteinG,
          fatG: m.template.fatG,
          carbsG: m.template.carbsG,
          ingredients: m.template.ingredients,
          instructions: m.template.instructions,
          dietaryTags: m.template.dietaryTags,
        },
      }));
  }

  /**
   * Смена тира → перегенерация плана.
   * Обновляет profile.nutritionTierPreference и вызывает generatePlan.
   */
  async updatePlan(
    planId: string,
    userId: string,
    dto: UpdatePlanDto,
  ): Promise<NutritionPlanResponseDto> {
    const plan = await this.planRepo.findOne({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('План не найден');

    if (dto.tier && dto.tier !== plan.tier) {
      await this.profileService.update(userId, { nutritionTierPreference: dto.tier });
      return this.generatePlan(userId);
    }

    return NutritionPlanResponseDto.fromEntity(plan);
  }

  // ============= selectMealTemplates =============

  /**
   * Выбор шаблонов:
   *   - Фильтр по tier
   *   - Фильтр по dietary restrictions: каждый template должен быть совместим
   *     (если у пользователя есть restriction X, template должен иметь X в dietaryTags)
   *   - Алгоритм: greedy по типам приёмов (breakfast/lunch/dinner/snack),
   *     добавляя до достижения caloriesTarget ±5% или максимум 5 шт на dayType
   */
  private async selectMealTemplates(params: {
    tier: NutritionTier;
    restrictions: DietaryRestriction[];
    caloriesTarget: number;
    proteinTargetG: number;
  }): Promise<Map<DayTemplate, MealTemplate[]>> {
    const candidates = await this.templateRepo.find({
      where: { tier: params.tier, isActive: true },
    });

    const compatible = candidates.filter((t) =>
      NutritionService.isDietCompatible(t.dietaryTags, params.restrictions),
    );

    const result = new Map<DayTemplate, MealTemplate[]>();
    const dayTypes: DayTemplate[] = ['training_day', 'rest_day', 'heavy_training_day'];

    for (const dayType of dayTypes) {
      const forDay = compatible.filter((t) => t.dayTemplate === dayType);
      if (forDay.length === 0) {
        // Fallback: используем training_day как default
        const fallback = compatible.filter((t) => t.dayTemplate === 'training_day');
        if (fallback.length > 0) {
          result.set(dayType, NutritionService.greedySelect(fallback, params.caloriesTarget));
        }
        continue;
      }
      result.set(dayType, NutritionService.greedySelect(forDay, params.caloriesTarget));
    }

    return result;
  }

  /**
   * Greedy: упорядочиваем по покрытию белка/калорий и добираем до целевой калорийности.
   * Static — для тестируемости.
   */
  static greedySelect(
    templates: MealTemplate[],
    caloriesTarget: number,
    maxMeals = 5,
  ): MealTemplate[] {
    const ordered = [...templates].sort((a, b) => b.proteinG - a.proteinG);
    const selected: MealTemplate[] = [];
    let totalKcal = 0;
    const upperBound = caloriesTarget * 1.05;

    for (const t of ordered) {
      if (selected.length >= maxMeals) break;
      if (totalKcal + t.calories > upperBound) continue;
      selected.push(t);
      totalKcal += t.calories;
    }

    // Если не добрали 80% калорий — добавим что есть, даже превысив cap
    if (totalKcal < caloriesTarget * 0.8 && selected.length < maxMeals) {
      for (const t of ordered) {
        if (selected.includes(t)) continue;
        if (selected.length >= maxMeals) break;
        selected.push(t);
        totalKcal += t.calories;
        if (totalKcal >= caloriesTarget * 0.95) break;
      }
    }

    return selected;
  }

  /**
   * Совместимость шаблона с диетой пользователя.
   * Если пользователь vegan, шаблон должен иметь vegan в dietaryTags.
   * NONE/пустой список restriction → совместимо всё.
   */
  static isDietCompatible(
    templateTags: DietaryRestriction[],
    userRestrictions: DietaryRestriction[],
  ): boolean {
    const realRestrictions = userRestrictions.filter(
      (r) => r !== DietaryRestriction.NONE,
    );
    if (realRestrictions.length === 0) return true;
    return realRestrictions.every((r) => templateTags.includes(r));
  }

  // ============= private helpers =============

  static defaultSupplements(tier: NutritionTier): SupplementInfo[] | null {
    if (tier !== NutritionTier.ADVANCED) return null;
    return [
      {
        name: 'Creatine Monohydrate',
        dose: '3-5 g/day',
        notes: 'Принимать ежедневно, в любое время. Доказательная база: ISSN position stand.',
      },
    ];
  }

  static buildPlanMeals(
    selected: Map<DayTemplate, MealTemplate[]>,
  ): NutritionPlanMeal[] {
    const meals: NutritionPlanMeal[] = [];
    for (const [dayType, templates] of selected.entries()) {
      templates.forEach((t, idx) => {
        const m = new NutritionPlanMeal();
        m.templateId = t.id;
        m.dayType = dayType;
        m.orderIndex = idx + 1;
        m.template = t;
        meals.push(m);
      });
    }
    return meals;
  }

  private async fetchCurrentPhase(userId: string): Promise<ProgramPhase | null> {
    try {
      const program = await this.programService.findActive(userId);
      // Берём первую неделю в фазе adaptation как default; в реальности
      // нужно было бы вычислять текущую неделю по startedAt — сделаем в Этапе 11.
      // Пока: phase из первой недели или null.
      return (program.weeks?.[0]?.phase as ProgramPhase) ?? null;
    } catch {
      return null;
    }
  }

  private async loadPlanWithRelations(
    planId: string,
    manager: DataSource['manager'],
  ): Promise<NutritionPlanResponseDto> {
    const plan = await manager.getRepository(NutritionPlan).findOneOrFail({
      where: { id: planId },
      relations: { meals: { template: true } },
    });
    return NutritionPlanResponseDto.fromEntity(plan);
  }
}
