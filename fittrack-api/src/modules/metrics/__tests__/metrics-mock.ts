import { MetricsService } from '../metrics.service';

/**
 * Мок MetricsService для unit-тестов: счётчики/гистограммы — no-op.
 */
export const mockMetricsService = {
  authAttempts: { inc: jest.fn() },
  programsGenerated: { inc: jest.fn() },
  programGenerationDuration: {
    observe: jest.fn(),
    startTimer: jest.fn(() => () => 0),
  },
  progressLogs: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
};

export const metricsServiceProvider = {
  provide: MetricsService,
  useValue: mockMetricsService,
};
