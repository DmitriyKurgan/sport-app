import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { setTokens, logout } from '../slices/authSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api/v1`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// baseQuery с авто-обновлением access-токена через refresh при 401
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await rawBaseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const data = refreshResult.data as { accessToken: string; refreshToken: string };
      api.dispatch(setTokens(data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Profile',
    'Screening',
    'BodyType',
    'Avatar',
    'Program',
    'TrainingDay',
    'Progress',
    'SessionRPE',
    'Measurements',
    'Analytics',
    'Nutrition',
    'Alerts',
    'MealTemplate',
  ],
  endpoints: () => ({}),
});
