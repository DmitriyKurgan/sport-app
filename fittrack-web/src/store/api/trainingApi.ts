import {
  CatalogQuery,
  ExerciseCatalogItem,
  ExerciseCatalogResponse,
  TrainingDay,
  TrainingProgram,
  TrainingProgramSummary,
} from '@/types';
import { baseApi } from './baseApi';

export const trainingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // === programs ===
    generateProgram: build.mutation<TrainingProgram, void>({
      query: () => ({ url: '/training/programs/generate', method: 'POST' }),
      invalidatesTags: ['Program', 'Analytics'],
    }),
    getActiveProgram: build.query<TrainingProgram, void>({
      query: () => '/training/programs/active',
      providesTags: ['Program'],
      keepUnusedDataFor: 300,
    }),
    getProgramById: build.query<TrainingProgram, string>({
      query: (id) => `/training/programs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Program', id }],
    }),
    getAllPrograms: build.query<TrainingProgramSummary[], void>({
      query: () => '/training/programs',
      providesTags: ['Program'],
    }),
    getProgramWeek: build.query<
      TrainingDay[],
      { programId: string; weekNumber: number }
    >({
      query: ({ programId, weekNumber }) =>
        `/training/programs/${programId}/weeks/${weekNumber}`,
      providesTags: ['Program'],
    }),
    deactivateProgram: build.mutation<void, string>({
      query: (id) => ({ url: `/training/programs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Program'],
    }),

    // === days ===
    getTrainingDay: build.query<TrainingDay, string>({
      query: (id) => `/training/days/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'TrainingDay', id }],
      keepUnusedDataFor: 60,
    }),
    startTrainingDay: build.mutation<TrainingDay, string>({
      query: (id) => ({ url: `/training/days/${id}/start`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'TrainingDay', id }, 'Program'],
    }),
    completeTrainingDay: build.mutation<TrainingDay, string>({
      query: (id) => ({ url: `/training/days/${id}/complete`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'TrainingDay', id },
        'Program',
        'Analytics',
        'Alerts',
      ],
    }),

    // === catalog ===
    getExerciseCatalog: build.query<ExerciseCatalogResponse, CatalogQuery>({
      query: (params) => ({ url: '/training/catalog', params }),
      keepUnusedDataFor: 3600,
    }),
    getExerciseBySlug: build.query<ExerciseCatalogItem, string>({
      query: (slug) => `/training/catalog/${slug}`,
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const {
  useGenerateProgramMutation,
  useGetActiveProgramQuery,
  useGetProgramByIdQuery,
  useGetAllProgramsQuery,
  useGetProgramWeekQuery,
  useDeactivateProgramMutation,
  useGetTrainingDayQuery,
  useStartTrainingDayMutation,
  useCompleteTrainingDayMutation,
  useGetExerciseCatalogQuery,
  useGetExerciseBySlugQuery,
} = trainingApi;
