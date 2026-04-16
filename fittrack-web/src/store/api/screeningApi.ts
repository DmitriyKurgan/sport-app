import { PARQQuestion, ScreeningResult, SubmitScreeningRequest } from '@/types';
import { baseApi } from './baseApi';

export const screeningApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getQuestions: build.query<{ questions: PARQQuestion[] }, void>({
      query: () => '/screening/questions',
    }),
    submitScreening: build.mutation<ScreeningResult, SubmitScreeningRequest>({
      query: (body) => ({ url: '/screening', method: 'POST', body }),
      invalidatesTags: ['Screening', 'Profile'],
    }),
    getLatestScreening: build.query<ScreeningResult, void>({
      query: () => '/screening/latest',
      providesTags: ['Screening'],
    }),
  }),
});

export const {
  useGetQuestionsQuery,
  useSubmitScreeningMutation,
  useGetLatestScreeningQuery,
} = screeningApi;
