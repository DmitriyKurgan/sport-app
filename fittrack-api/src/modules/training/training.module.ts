import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';
import { TrainingEngineModule } from '../training-engine/training-engine.module';
import { UserModule } from '../user/user.module';
import {
  ExerciseController,
  TrainingDayController,
  TrainingProgramController,
} from './controllers';
import {
  Exercise,
  TrainingDay,
  TrainingDayExercise,
  TrainingProgram,
  TrainingWeek,
} from './entities';
import {
  ExerciseService,
  TrainingDayService,
  TrainingProgramService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exercise,
      TrainingProgram,
      TrainingWeek,
      TrainingDay,
      TrainingDayExercise,
    ]),
    UserModule, // JwtAuthGuard
    ProfileModule, // ProfileService
    TrainingEngineModule, // pure-logic engine
  ],
  providers: [ExerciseService, TrainingProgramService, TrainingDayService],
  controllers: [
    ExerciseController,
    TrainingProgramController,
    TrainingDayController,
  ],
  exports: [ExerciseService, TrainingProgramService, TrainingDayService, TypeOrmModule],
})
export class TrainingModule {}
