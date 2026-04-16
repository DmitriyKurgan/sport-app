import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingEngineModule } from '../training-engine/training-engine.module';
import { TrainingModule } from '../training/training.module';
import { UserModule } from '../user/user.module';
import { BodyMeasurementController } from './controllers/body-measurement.controller';
import { ProgressController } from './controllers/progress.controller';
import { BodyMeasurement, ProgressLog, SessionRPELog } from './entities';
import { BodyMeasurementService } from './services/body-measurement.service';
import { ProgressLogService } from './services/progress-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgressLog, SessionRPELog, BodyMeasurement]),
    UserModule, // JwtAuthGuard
    TrainingEngineModule, // calculateE1RM, calculateInternalLoad
    TrainingModule, // TrainingDay для проверки IDOR
  ],
  providers: [ProgressLogService, BodyMeasurementService],
  controllers: [ProgressController, BodyMeasurementController],
  exports: [ProgressLogService, BodyMeasurementService],
})
export class ProgressModule {}
