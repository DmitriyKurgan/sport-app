import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { JobsListener } from '../jobs.listener';
import { JobsScheduler } from '../jobs.scheduler';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

const mkQueue = () => ({ add: jest.fn().mockResolvedValue({}) });

describe('JobsScheduler', () => {
  let scheduler: JobsScheduler;
  let alertsQueue: any;
  let nutritionQueue: any;
  let reportsQueue: any;
  let authQueue: any;

  beforeEach(async () => {
    alertsQueue = mkQueue();
    nutritionQueue = mkQueue();
    reportsQueue = mkQueue();
    authQueue = mkQueue();

    const module = await Test.createTestingModule({
      providers: [
        JobsScheduler,
        { provide: getQueueToken(QUEUE_NAMES.ALERTS), useValue: alertsQueue },
        { provide: getQueueToken(QUEUE_NAMES.NUTRITION), useValue: nutritionQueue },
        { provide: getQueueToken(QUEUE_NAMES.REPORTS), useValue: reportsQueue },
        { provide: getQueueToken(QUEUE_NAMES.AUTH), useValue: authQueue },
      ],
    }).compile();
    scheduler = module.get(JobsScheduler);
  });

  it('dailyAlertsRun ставит задачу в очередь alerts', async () => {
    await scheduler.dailyAlertsRun();
    expect(alertsQueue.add).toHaveBeenCalledWith(
      JOB_NAMES.ALL_USERS_ALERT_DETECTORS,
      {},
      expect.any(Object),
    );
  });

  it('weeklyNutritionRecalibrate', async () => {
    await scheduler.weeklyNutritionRecalibrate();
    expect(nutritionQueue.add).toHaveBeenCalledWith(
      JOB_NAMES.RECALIBRATE_NUTRITION_ALL,
      {},
      expect.any(Object),
    );
  });

  it('weeklyReport', async () => {
    await scheduler.weeklyReport();
    expect(reportsQueue.add).toHaveBeenCalledWith(
      JOB_NAMES.WEEKLY_REPORT_ALL,
      {},
      expect.any(Object),
    );
  });

  it('cleanupTokens', async () => {
    await scheduler.cleanupTokens();
    expect(authQueue.add).toHaveBeenCalledWith(
      JOB_NAMES.CLEANUP_EXPIRED_TOKENS,
      {},
      expect.any(Object),
    );
  });
});

describe('JobsListener', () => {
  let listener: JobsListener;
  let progressionQueue: any;
  let bodyScoringQueue: any;

  beforeEach(async () => {
    progressionQueue = mkQueue();
    bodyScoringQueue = mkQueue();
    const module = await Test.createTestingModule({
      providers: [
        JobsListener,
        { provide: getQueueToken(QUEUE_NAMES.PROGRESSION), useValue: progressionQueue },
        { provide: getQueueToken(QUEUE_NAMES.BODY_SCORING), useValue: bodyScoringQueue },
      ],
    }).compile();
    listener = module.get(JobsListener);
  });

  it('onProgressLogged ставит body-scoring (если не warmup)', async () => {
    await listener.onProgressLogged({
      userId: 'u1',
      isWarmup: false,
    } as any);
    expect(bodyScoringQueue.add).toHaveBeenCalledWith(
      JOB_NAMES.RECALCULATE_BODY_SCORING,
      { userId: 'u1' },
      expect.any(Object),
    );
  });

  it('onProgressLogged игнорирует warmup', async () => {
    await listener.onProgressLogged({ userId: 'u1', isWarmup: true } as any);
    expect(bodyScoringQueue.add).not.toHaveBeenCalled();
  });

  it('onSessionRpeLogged ставит progression-check', async () => {
    await listener.onSessionRpeLogged({
      userId: 'u1',
      trainingDayId: 'd1',
    } as any);
    expect(progressionQueue.add).toHaveBeenCalledWith(
      JOB_NAMES.CHECK_PROGRESSION,
      { userId: 'u1', trainingDayId: 'd1' },
      expect.any(Object),
    );
  });

  it('onBodyMeasurementAdded ставит body-scoring', async () => {
    await listener.onBodyMeasurementAdded({ userId: 'u1' } as any);
    expect(bodyScoringQueue.add).toHaveBeenCalled();
  });
});
