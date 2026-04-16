import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AvatarModule } from '../avatar/avatar.module';
import { BodyTypeModule } from '../body-type/body-type.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ProgressLog } from '../progress/entities';
import { ProgressModule } from '../progress/progress.module';
import {
  TrainingDay,
  TrainingDayExercise,
  TrainingProgram,
  TrainingWeek,
} from '../training/entities';
import { TrainingEngineModule } from '../training-engine/training-engine.module';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { JobsListener } from './jobs.listener';
import { JobsScheduler } from './jobs.scheduler';
import {
  AlertsProcessor,
  AuthProcessor,
  BodyScoringProcessor,
  NutritionProcessor,
  ProgressionProcessor,
  ReportsProcessor,
} from './processors';
import { QUEUE_NAMES } from './queues';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ALERTS },
      { name: QUEUE_NAMES.PROGRESSION },
      { name: QUEUE_NAMES.BODY_SCORING },
      { name: QUEUE_NAMES.NUTRITION },
      { name: QUEUE_NAMES.REPORTS },
      { name: QUEUE_NAMES.AUTH },
    ),
    TypeOrmModule.forFeature([
      User,
      TrainingDay,
      TrainingWeek,
      TrainingProgram,
      TrainingDayExercise,
      ProgressLog,
    ]),
    UserModule,
    AlertsModule,
    BodyTypeModule,
    AvatarModule,
    NutritionModule,
    ProgressModule,
    AnalyticsModule,
    TrainingEngineModule,
  ],
  providers: [
    JobsScheduler,
    JobsListener,
    AlertsProcessor,
    AuthProcessor,
    BodyScoringProcessor,
    NutritionProcessor,
    ProgressionProcessor,
    ReportsProcessor,
  ],
})
export class JobsModule {}
