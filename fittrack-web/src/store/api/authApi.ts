import {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
  User,
} from '@/types';
import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    refresh: build.mutation<AuthTokens, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),

    me: build.query<User, void>({
      query: () => '/users/me',
    }),
    updateMe: build.mutation<User, UpdateUserRequest>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
    }),
    deleteMe: build.mutation<void, void>({
      query: () => ({ url: '/users/me', method: 'DELETE' }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateMeMutation,
  useDeleteMeMutation,
} = authApi;
