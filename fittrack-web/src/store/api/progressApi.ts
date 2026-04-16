import { PaginatedResponse } from '@/types';
import {
  BodyMeasurement,
  CreateBodyMeasurementRequest,
  CreateProgressLogRequest,
  LogSessionRPERequest,
  PersonalRecord,
  ProgressLog,
  SessionRPELog,
  WeeklyAggregate,
  WeightTrendPoint,
} from '@/types/progress';
import { baseApi } from './baseApi';

interface LogsQuery {
  exerciseId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const progressApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // === sets ===
    logSet: build.mutation<ProgressLog, CreateProgressLogRequest>({
      query: (body) => ({ url: '/progress/log', method: 'POST', body }),
      invalidatesTags: (_r, _e, { trainingDayId }) =>
        trainingDayId
          ? [{ type: 'TrainingDay', id: trainingDayId }, 'Progress', 'Analytics', 'Alerts']
          : ['Progress', 'Analytics', 'Alerts'],
    }),

    // === session-rpe ===
    logSessionRPE: build.mutation<SessionRPELog, LogSessionRPERequest>({
      query: (body) => ({ url: '/progress/session-rpe', method: 'POST', body }),
      invalidatesTags: ['SessionRPE', 'Analytics', 'Alerts'],
    }),

    // === queries ===
    getProgressLogs: build.query<PaginatedResponse<ProgressLog>, LogsQuery>({
      query: (params) => ({ url: '/progress/logs', params }),
      providesTags: ['Progress'],
    }),
    getLogsByExercise: build.query<ProgressLog[], string>({
      query: (exerciseId) => `/progress/logs/exercise/${exerciseId}`,
      providesTags: ['Progress'],
    }),
    getPersonalRecords: build.query<PersonalRecord[], void>({
      query: () => '/progress/records',
      providesTags: ['Progress'],
    }),
    getVolumeLoad: build.query<WeeklyAggregate[], void>({
      query: () => '/progress/volume-load',
      providesTags: ['Progress', 'Analytics'],
    }),
    getInternalLoad: build.query<WeeklyAggregate[], void>({
      query: () => '/progress/internal-load',
      providesTags: ['SessionRPE', 'Analytics'],
    }),

    // === measurements ===
    addMeasurement: build.mutation<BodyMeasurement, CreateBodyMeasurementRequest>({
      query: (body) => ({ url: '/progress/measurements', method: 'POST', body }),
      invalidatesTags: ['Measurements', 'Analytics', 'BodyType', 'Avatar', 'Alerts'],
    }),
    getMeasurements: build.query<BodyMeasurement[], void>({
      query: () => '/progress/measurements',
      providesTags: ['Measurements'],
    }),
    getLatestMeasurement: build.query<BodyMeasurement, void>({
      query: () => '/progress/measurements/latest',
      providesTags: ['Measurements'],
    }),
    getWeightTrend: build.query<WeightTrendPoint[], { days?: number }>({
      query: (params) => ({ url: '/progress/measurements/weight-trend', params }),
      providesTags: ['Measurements'],
    }),
  }),
});

export const {
  useLogSetMutation,
  useLogSessionRPEMutation,
  useGetProgressLogsQuery,
  useGetLogsByExerciseQuery,
  useGetPersonalRecordsQuery,
  useGetVolumeLoadQuery,
  useGetInternalLoadQuery,
  useAddMeasurementMutation,
  useGetMeasurementsQuery,
  useGetLatestMeasurementQuery,
  useGetWeightTrendQuery,
} = progressApi;
