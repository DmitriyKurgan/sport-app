import { BodyTypeHistory, BodyTypeSnapshot } from '@/types';
import { baseApi } from './baseApi';

export const bodyTypeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentBodyType: build.query<BodyTypeSnapshot, void>({
      query: () => '/body-type',
      providesTags: ['BodyType'],
      keepUnusedDataFor: 300,
    }),
    getBodyTypeHistory: build.query<BodyTypeHistory, { limit?: number }>({
      query: (params) => ({ url: '/body-type/history', params }),
      providesTags: ['BodyType'],
    }),
    recalculateBodyType: build.mutation<BodyTypeSnapshot, void>({
      query: () => ({ url: '/body-type/recalculate', method: 'POST' }),
      invalidatesTags: ['BodyType', 'Avatar'],
    }),
  }),
});

export const {
  useGetCurrentBodyTypeQuery,
  useGetBodyTypeHistoryQuery,
  useRecalculateBodyTypeMutation,
} = bodyTypeApi;
