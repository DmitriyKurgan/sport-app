import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreScreeningService } from '../pre-screening/pre-screening.service';
import {
  calculateActivityFactor,
  calculateBMI,
  calculateProteinTarget,
  calculateREE,
  calculateTDEE,
} from './calculators';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './profile.entity';

export interface DerivedFields {
  bmi: number;
  ree: number;
  tdee: number;
  activityFactor: number;
  proteinTargetG: number;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly repo: Repository<Profile>,
    private readonly preScreening: PreScreeningService,
  ) {}

  async create(userId: string, dto: CreateProfileDto): Promise<ProfileResponseDto> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Профиль уже создан. Используйте PATCH для обновления.');
    }

    // Подтягиваем preScreeningRedFlags из последнего скрининга.
    // Если скрининга ещё не было — считаем что redFlags=false (UX позволит
    // создать профиль, но в онбординге скрининг идёт раньше профиля).
    const redFlags = await this.fetchPreScreeningRedFlags(userId);

    const derived = ProfileService.calculateDerivedFields({
      sex: dto.sex,
      weightKg: dto.weightKg,
      heightCm: dto.heightCm,
      ageYears: dto.ageYears,
      dailyActivityLevel: dto.dailyActivityLevel,
      weeklyTrainingDaysTarget: dto.weeklyTrainingDaysTarget,
      bodyweightGoal: dto.bodyweightGoal,
      tier: dto.nutritionTierPreference,
    });

    const profile = this.repo.create({
      userId,
      sex: dto.sex,
      ageYears: dto.ageYears,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      waistCm: dto.waistCm ?? null,
      experienceLevel: dto.experienceLevel,
      currentTrainingDaysPerWeek: dto.currentTrainingDaysPerWeek,
      technicalConfidence: dto.technicalConfidence ?? null,
      baselineSquatKg: dto.baselineStrengthOptional?.squatKg ?? null,
      baselineBenchKg: dto.baselineStrengthOptional?.benchKg ?? null,
      baselineDeadliftKg: dto.baselineStrengthOptional?.deadliftKg ?? null,
      baselinePullupsMax: dto.baselineStrengthOptional?.pullUpsMaxReps ?? null,
      primaryTrainingGoal: dto.primaryTrainingGoal,
      bodyweightGoal: dto.bodyweightGoal,
      weeklyTrainingDaysTarget: dto.weeklyTrainingDaysTarget,
      sessionDurationMinutes: dto.sessionDurationMinutes,
      equipmentAccess: dto.equipmentAccess,
      injuryPainFlags: dto.injuryPainFlags,
      preScreeningRedFlags: redFlags,
      sleepHoursAvg: dto.sleepHoursAvg,
      stressLevel: dto.stressLevel,
      dailyActivityLevel: dto.dailyActivityLevel,
      nutritionTierPreference: dto.nutritionTierPreference,
      dietaryRestrictions: dto.dietaryRestrictions ?? [],
      bmi: derived.bmi,
      ree: derived.ree,
      tdee: derived.tdee,
      activityFactor: derived.activityFactor,
    });

    await this.repo.save(profile);
    this.logger.log(`Profile created: userId=${userId}, tdee=${derived.tdee}`);

    return ProfileResponseDto.fromEntity(profile, derived.proteinTargetG);
  }

  async findByUserId(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Профиль не найден');

    const proteinTargetG = calculateProteinTarget({
      weightKg: profile.weightKg,
      bodyweightGoal: profile.bodyweightGoal,
      tier: profile.nutritionTierPreference,
    });

    return ProfileResponseDto.fromEntity(profile, proteinTargetG);
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Профиль не найден');

    // Обновляем только предоставленные поля
    Object.assign(profile, {
      sex: dto.sex ?? profile.sex,
      ageYears: dto.ageYears ?? profile.ageYears,
      heightCm: dto.heightCm ?? profile.heightCm,
      weightKg: dto.weightKg ?? profile.weightKg,
      waistCm: dto.waistCm !== undefined ? dto.waistCm : profile.waistCm,
      experienceLevel: dto.experienceLevel ?? profile.experienceLevel,
      currentTrainingDaysPerWeek:
        dto.currentTrainingDaysPerWeek ?? profile.currentTrainingDaysPerWeek,
      technicalConfidence:
        dto.technicalConfidence !== undefined ? dto.technicalConfidence : profile.technicalConfidence,
      primaryTrainingGoal: dto.primaryTrainingGoal ?? profile.primaryTrainingGoal,
      bodyweightGoal: dto.bodyweightGoal ?? profile.bodyweightGoal,
      weeklyTrainingDaysTarget: dto.weeklyTrainingDaysTarget ?? profile.weeklyTrainingDaysTarget,
      sessionDurationMinutes: dto.sessionDurationMinutes ?? profile.sessionDurationMinutes,
      equipmentAccess: dto.equipmentAccess ?? profile.equipmentAccess,
      injuryPainFlags: dto.injuryPainFlags ?? profile.injuryPainFlags,
      sleepHoursAvg: dto.sleepHoursAvg ?? profile.sleepHoursAvg,
      stressLevel: dto.stressLevel ?? profile.stressLevel,
      dailyActivityLevel: dto.dailyActivityLevel ?? profile.dailyActivityLevel,
      nutritionTierPreference: dto.nutritionTierPreference ?? profile.nutritionTierPreference,
      dietaryRestrictions: dto.dietaryRestrictions ?? profile.dietaryRestrictions,
    });

    if (dto.baselineStrengthOptional) {
      profile.baselineSquatKg =
        dto.baselineStrengthOptional.squatKg ?? profile.baselineSquatKg;
      profile.baselineBenchKg =
        dto.baselineStrengthOptional.benchKg ?? profile.baselineBenchKg;
      profile.baselineDeadliftKg =
        dto.baselineStrengthOptional.deadliftKg ?? profile.baselineDeadliftKg;
      profile.baselinePullupsMax =
        dto.baselineStrengthOptional.pullUpsMaxReps ?? profile.baselinePullupsMax;
    }

    // Пересчитать derived (могли измениться weight/height/age/activity/goal/tier)
    const derived = ProfileService.calculateDerivedFields({
      sex: profile.sex,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      ageYears: profile.ageYears,
      dailyActivityLevel: profile.dailyActivityLevel,
      weeklyTrainingDaysTarget: profile.weeklyTrainingDaysTarget,
      bodyweightGoal: profile.bodyweightGoal,
      tier: profile.nutritionTierPreference,
    });
    profile.bmi = derived.bmi;
    profile.ree = derived.ree;
    profile.tdee = derived.tdee;
    profile.activityFactor = derived.activityFactor;

    await this.repo.save(profile);
    return ProfileResponseDto.fromEntity(profile, derived.proteinTargetG);
  }

  /**
   * Обновить preScreeningRedFlags из последнего скрининга.
   * Используется при повторном прохождении PAR-Q+.
   */
  async syncPreScreeningFlags(userId: string): Promise<void> {
    const redFlags = await this.fetchPreScreeningRedFlags(userId);
    await this.repo.update({ userId }, { preScreeningRedFlags: redFlags });
  }

  /**
   * Чистая функция расчёта derived полей.
   * Вынесена как static для тестируемости и переиспользования.
   */
  static calculateDerivedFields(params: Parameters<typeof calculateREE>[0] & {
    dailyActivityLevel: Parameters<typeof calculateActivityFactor>[0]['dailyActivityLevel'];
    weeklyTrainingDaysTarget: number;
    bodyweightGoal: Parameters<typeof calculateProteinTarget>[0]['bodyweightGoal'];
    tier: Parameters<typeof calculateProteinTarget>[0]['tier'];
  }): DerivedFields {
    const bmi = calculateBMI(params.weightKg, params.heightCm);
    const ree = calculateREE({
      sex: params.sex,
      weightKg: params.weightKg,
      heightCm: params.heightCm,
      ageYears: params.ageYears,
    });
    const activityFactor = calculateActivityFactor({
      dailyActivityLevel: params.dailyActivityLevel,
      weeklyTrainingDaysTarget: params.weeklyTrainingDaysTarget,
    });
    const tdee = calculateTDEE(ree, activityFactor);
    const proteinTargetG = calculateProteinTarget({
      weightKg: params.weightKg,
      bodyweightGoal: params.bodyweightGoal,
      tier: params.tier,
    });
    return { bmi, ree, tdee, activityFactor, proteinTargetG };
  }

  private async fetchPreScreeningRedFlags(userId: string): Promise<boolean> {
    try {
      const latest = await this.preScreening.findLatest(userId);
      return latest.redFlags;
    } catch {
      // скрининга ещё нет — безопасный default
      return false;
    }
  }
}
