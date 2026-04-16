import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ProfileModule } from '../profile/profile.module';
import { ProgressModule } from '../progress/progress.module';
import { Exercise, TrainingProgram } from '../training/entities';
import { TrainingModule } from '../training/training.module';
import { UserModule } from '../user/user.module';
import { Alert } from './alert.entity';
import { AlertsController } from './alerts.controller';
import { AlertsListener } from './alerts.listener';
import { AlertsService } from './alerts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, TrainingProgram, Exercise]),
    UserModule, // JwtAuthGuard
    ProfileModule, // ProfileService
    ProgressModule, // ProgressLogService + BodyMeasurementService
    NutritionModule, // NutritionService.recalibrate
    TrainingModule, // TrainingProgram entity (forFeature выше)
  ],
  providers: [AlertsService, AlertsListener],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
