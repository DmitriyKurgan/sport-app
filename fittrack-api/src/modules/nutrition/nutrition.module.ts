import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';
import { TrainingModule } from '../training/training.module';
import { UserModule } from '../user/user.module';
import { MealTemplate, NutritionPlan, NutritionPlanMeal } from './entities';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NutritionPlan, MealTemplate, NutritionPlanMeal]),
    UserModule, // JwtAuthGuard
    ProfileModule, // ProfileService
    TrainingModule, // TrainingProgramService для текущей фазы
  ],
  providers: [NutritionService],
  controllers: [NutritionController],
  exports: [NutritionService],
})
export class NutritionModule {}
