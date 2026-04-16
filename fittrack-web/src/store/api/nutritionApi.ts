import {
  DayTemplate,
  NutritionPlan,
  PlannedMeal,
  RecalibrateRequest,
  UpdatePlanRequest,
} from '@/types';
import { baseApi } from './baseApi';

export const nutritionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    generatePlan: build.mutation<NutritionPlan, void>({
      query: () => ({ url: '/nutrition/generate', method: 'POST' }),
      invalidatesTags: ['Nutrition'],
    }),
    recalibratePlan: build.mutation<NutritionPlan, RecalibrateRequest>({
      query: (body) => ({ url: '/nutrition/recalibrate', method: 'POST', body }),
      invalidatesTags: ['Nutrition'],
    }),
    getPlan: build.query<NutritionPlan, void>({
      query: () => '/nutrition/plan',
      providesTags: ['Nutrition'],
      keepUnusedDataFor: 600,
    }),
    updatePlan: build.mutation<NutritionPlan, { id: string; body: UpdatePlanRequest }>({
      query: ({ id, body }) => ({ url: `/nutrition/plan/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Nutrition'],
    }),
    getPlanMeals: build.query<PlannedMeal[], { id: string; dayType?: DayTemplate }>({
      query: ({ id, dayType }) => ({
        url: `/nutrition/plan/${id}/meals`,
        params: dayType ? { dayType } : {},
      }),
      providesTags: ['Nutrition'],
    }),
  }),
});

export const {
  useGeneratePlanMutation,
  useRecalibratePlanMutation,
  useGetPlanQuery,
  useUpdatePlanMutation,
  useGetPlanMealsQuery,
} = nutritionApi;
