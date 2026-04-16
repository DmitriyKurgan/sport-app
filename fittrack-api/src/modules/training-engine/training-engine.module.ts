import { Module } from '@nestjs/common';
import { TrainingEngineService } from './training-engine.service';

/**
 * Pure-logic модуль: никаких DB, HTTP, зависимостей от других доменов.
 * Consumer (TrainingModule) импортирует TrainingEngineService и вызывает методы.
 */
@Module({
  providers: [TrainingEngineService],
  exports: [TrainingEngineService],
})
export class TrainingEngineModule {}
