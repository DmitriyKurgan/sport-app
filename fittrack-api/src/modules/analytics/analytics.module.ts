import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';
import { ProgressModule } from '../progress/progress.module';
import { TrainingEngineModule } from '../training-engine/training-engine.module';
import { TrainingModule } from '../training/training.module';
import {
  Exercise,
  TrainingDay,
  TrainingProgram,
} from '../training/entities';
import { UserModule } from '../user/user.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingProgram, TrainingDay, Exercise]),
    UserModule, // JwtAuthGuard
    ProfileModule, // ProfileService
    ProgressModule, // ProgressLogService + BodyMeasurementService
    TrainingEngineModule, // TrainingEngineService
    TrainingModule, // entities (через forFeature выше) и сервисы при необходимости
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
