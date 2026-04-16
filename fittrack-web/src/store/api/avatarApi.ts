import { AvatarSnapshot, AvatarTransformation } from '@/types';
import { baseApi } from './baseApi';

export const avatarApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentAvatar: build.query<AvatarSnapshot, void>({
      query: () => '/avatar',
      providesTags: ['Avatar'],
      keepUnusedDataFor: 300,
    }),
    getAvatarTransformation: build.query<
      AvatarTransformation,
      { from?: string; to?: string }
    >({
      query: (params) => ({ url: '/avatar/transformation', params }),
      providesTags: ['Avatar'],
    }),
    recalculateAvatar: build.mutation<AvatarSnapshot, void>({
      query: () => ({ url: '/avatar/recalculate', method: 'POST' }),
      invalidatesTags: ['Avatar'],
    }),
  }),
});

export const {
  useGetCurrentAvatarQuery,
  useGetAvatarTransformationQuery,
  useRecalculateAvatarMutation,
} = avatarApi;
