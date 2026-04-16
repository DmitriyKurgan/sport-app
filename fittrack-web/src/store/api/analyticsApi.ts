import {
  BodyCompositionPoint,
  ChartDataPoint,
  DashboardResponse,
  ExerciseProgressPoint,
  WeeklyReport,
} from '@/types';
import { baseApi } from './baseApi';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query<DashboardResponse, void>({
      query: () => '/analytics/dashboard',
      providesTags: ['Analytics'],
      keepUnusedDataFor: 120,
    }),
    getExerciseAnalytics: build.query<ExerciseProgressPoint[], string>({
      query: (exerciseId) => `/analytics/exercise/${exerciseId}`,
      providesTags: ['Analytics'],
      keepUnusedDataFor: 300,
    }),
    getVolumeAnalytics: build.query<ChartDataPoint[], void>({
      query: () => '/analytics/volume',
      providesTags: ['Analytics'],
    }),
    getInternalLoadAnalytics: build.query<ChartDataPoint[], void>({
      query: () => '/analytics/internal-load',
      providesTags: ['Analytics'],
    }),
    getBodyAnalytics: build.query<BodyCompositionPoint[], void>({
      query: () => '/analytics/body',
      providesTags: ['Analytics', 'Measurements'],
    }),
    getWeeklyReport: build.query<WeeklyReport, void>({
      query: () => '/analytics/report/weekly',
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetExerciseAnalyticsQuery,
  useGetVolumeAnalyticsQuery,
  useGetInternalLoadAnalyticsQuery,
  useGetBodyAnalyticsQuery,
  useGetWeeklyReportQuery,
} = analyticsApi;
