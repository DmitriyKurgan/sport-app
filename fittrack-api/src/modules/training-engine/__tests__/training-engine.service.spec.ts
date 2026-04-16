import { Test } from '@nestjs/testing';
import { TrainingEngineService } from '../training-engine.service';
import { makeCatalog, makeProfile } from './fixtures';

describe('TrainingEngineService (facade)', () => {
  let service: TrainingEngineService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TrainingEngineService],
    }).compile();
    service = module.get(TrainingEngineService);
  });

  it('generateProgram делегирует в pure generator', () => {
    const program = service.generateProgram(makeProfile(), makeCatalog());
    expect(program.totalWeeks).toBe(12);
  });

  it('resolveDaysTarget — beginner cap', () => {
    expect(
      service.resolveDaysTarget(
        makeProfile({ experienceLevel: 'novice' as any, weeklyTrainingDaysTarget: 6 }),
      ),
    ).toBe(4);
  });

  it('calculateE1RM: 80кг × 10 повторов ≈ 106.67', () => {
    expect(service.calculateE1RM(80, 10)).toBeCloseTo(106.67, 1);
  });

  it('calculateVolumeLoad', () => {
    const logs = [
      { weightKg: 100, reps: 10 },
      { weightKg: 90, reps: 10 },
    ];
    expect(service.calculateVolumeLoad(logs)).toBe(1900);
  });

  it('calculateInternalLoad', () => {
    expect(service.calculateInternalLoad(7, 60)).toBe(420);
  });

  it('shouldDeload on week 4', () => {
    const d = service.shouldDeload({
      weekNumber: 4,
      avgRIRPerWeek: [],
      avgSessionRPEPerWeek: [],
      e1rmHistory: [],
    });
    expect(d.shouldDeload).toBe(true);
  });

  it('recalibrateFirstWeek: берёт max из safe-RIR подходов', () => {
    const result = service.recalibrateFirstWeek([
      {
        exerciseId: 'ex-1',
        logs: [
          { weightKg: 50, reps: 10, rir: 0 },   // не safe
          { weightKg: 60, reps: 10, rir: 3 },   // safe
          { weightKg: 65, reps: 8, rir: 2 },    // safe
        ],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].calibratedLoadKg).toBe(65);
    expect(result[0].reason).toBe('based_on_rir_safe_sets');
  });

  it('recalibrateFirstWeek: если нет safe-sets → fallback', () => {
    const result = service.recalibrateFirstWeek([
      {
        exerciseId: 'ex-1',
        logs: [
          { weightKg: 50, reps: 10, rir: 0 },
          { weightKg: 55, reps: 8, rir: 1 },
        ],
      },
    ]);
    expect(result[0].calibratedLoadKg).toBe(55);
    expect(result[0].reason).toBe('fallback_to_all_working_sets');
  });
});
