import { CreateProfileRequest, ProfileResponse, UpdateProfileRequest } from '@/types';
import { baseApi } from './baseApi';

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createProfile: build.mutation<ProfileResponse, CreateProfileRequest>({
      query: (body) => ({ url: '/profile', method: 'POST', body }),
      invalidatesTags: ['Profile', 'BodyType', 'Avatar', 'Nutrition', 'Program'],
    }),
    getProfile: build.query<ProfileResponse, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
      keepUnusedDataFor: 600,
    }),
    updateProfile: build.mutation<ProfileResponse, UpdateProfileRequest>({
      query: (body) => ({ url: '/profile', method: 'PATCH', body }),
      invalidatesTags: ['Profile', 'BodyType', 'Avatar', 'Nutrition'],
    }),
  }),
});

export const {
  useCreateProfileMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = profileApi;
